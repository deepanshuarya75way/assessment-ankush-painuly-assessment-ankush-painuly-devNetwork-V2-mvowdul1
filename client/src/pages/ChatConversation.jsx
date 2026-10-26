import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import PremiumBadge from "../components/PremiumBadge";
import { connectAppSocket } from "../socket/appSocket";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const formatMessageTime = (dateString) =>
  new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

function MessageTicks({ seen }) {
  return (
    <span
      className={`inline-flex items-center ${seen ? "text-sky-300" : "text-white/70"}`}
      title={seen ? "Seen" : "Sent"}
    >
      <span>✔︎</span>
      {seen ? <span>✔︎</span> : null}
    </span>
  );
}

const getCallLabel = (callType) =>
  callType === "video" ? "Video call" : "Audio call";

export default function ChatConversation() {
  const { userId: targetUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((store) => store.user);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const handledAutoAnswerRef = useRef(false);

  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);
  const [callType, setCallType] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [callError, setCallError] = useState("");
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);

  const activeUser = activeChat?.targetUser || null;

  const attachLocalStream = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const attachRemoteStream = (stream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  };

  const stopLocalMedia = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalReady(false);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const resetRemoteMedia = () => {
    remoteStreamRef.current = null;
    setRemoteReady(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const resetCallState = ({ preserveType = false } = {}) => {
    closePeerConnection();
    stopLocalMedia();
    resetRemoteMedia();
    setCallStatus("idle");
    setCallError("");
    if (!preserveType) {
      setCallType(null);
    }
  };

  const ensureLocalMedia = async (nextCallType) => {
    if (localStreamRef.current && callType === nextCallType) {
      attachLocalStream(localStreamRef.current);
      setLocalReady(true);
      return localStreamRef.current;
    }

    stopLocalMedia();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: nextCallType === "video",
    });

    localStreamRef.current = stream;
    attachLocalStream(stream);
    setLocalReady(true);
    setCallType(nextCallType);
    return stream;
  };

  const createPeerConnection = (nextCallType) => {
    closePeerConnection();
    resetRemoteMedia();

    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    remoteStreamRef.current = new MediaStream();
    attachRemoteStream(remoteStreamRef.current);

    peerConnection.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !targetUserId) return;

      socketRef.current.emit("webrtc:ice-candidate", {
        targetUserId,
        candidate: event.candidate,
      });
    };

    peerConnection.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStreamRef.current?.addTrack(track);
      });
      attachRemoteStream(remoteStreamRef.current);
      setRemoteReady(true);
      setCallStatus("active");
      setCallError("");
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    setCallType(nextCallType);
    return peerConnection;
  };

  const handleEndCall = (notifyPeer = true) => {
    if (notifyPeer && socketRef.current && targetUserId && callStatus !== "idle") {
      socketRef.current.emit("endCall", { targetUserId });
    }

    resetCallState();
  };

  const startOutgoingCall = async (nextCallType) => {
    try {
      if (!socketRef.current || !targetUserId) return;

      await ensureLocalMedia(nextCallType);
      setCallStatus("calling");
      setCallError("");

      socketRef.current.emit(
        "callUser",
        { targetUserId, callType: nextCallType },
        (response) => {
          if (response?.success) return;

          toast.error(response?.message || "Call could not start");
          resetCallState();
        }
      );
    } catch (error) {
      toast.error(error.message || "Microphone or camera access failed");
      resetCallState();
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = connectAppSocket();

    const handleMessageReceived = ({ message, targetUserId: roomUserId }) => {
      if (roomUserId !== targetUserId) return;

      setMessages((current) => {
        const alreadyExists = current.some((item) => item._id === message._id);
        if (alreadyExists) return current;
        return [...current, message];
      });
    };

    const handleMessagesSeen = ({ messageIds }) => {
      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(message._id)
            ? { ...message, seen: true, seenAt: new Date().toISOString() }
            : message
        )
      );
    };

    const handlePresenceUpdate = ({ userId, isOnline, lastSeen }) => {
      if (userId !== targetUserId) return;

      setActiveChat((current) =>
        current
          ? {
              ...current,
              targetUser: {
                ...current.targetUser,
                isOnline,
                lastSeen,
              },
            }
          : current
      );
    };

    const handleCallAccepted = async ({ fromUserId, callType: acceptedCallType }) => {
      if (fromUserId !== targetUserId) return;

      try {
        const stream = await ensureLocalMedia(acceptedCallType);
        const peerConnection = createPeerConnection(acceptedCallType);
        stream.getTracks().forEach((track) => {
          const alreadyAdded = peerConnection
            .getSenders()
            .some((sender) => sender.track?.id === track.id);

          if (!alreadyAdded) {
            peerConnection.addTrack(track, stream);
          }
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socketRef.current?.emit("webrtc:offer", {
          targetUserId,
          offer,
          callType: acceptedCallType,
        });
        setCallStatus("connecting");
      } catch (error) {
        toast.error(error.message || "Could not start the call");
        resetCallState();
      }
    };

    const handleCallRejected = ({ fromUserId }) => {
      if (fromUserId !== targetUserId) return;

      toast("Call declined");
      resetCallState();
    };

    const handleCallEnded = ({ fromUserId }) => {
      if (fromUserId !== targetUserId) return;

      toast("Call ended");
      resetCallState();
    };

    const handleOffer = async ({ fromUserId, offer, callType: offerCallType }) => {
      if (fromUserId !== targetUserId) return;

      try {
        const stream = await ensureLocalMedia(offerCallType);
        const peerConnection = createPeerConnection(offerCallType);
        stream.getTracks().forEach((track) => {
          const alreadyAdded = peerConnection
            .getSenders()
            .some((sender) => sender.track?.id === track.id);

          if (!alreadyAdded) {
            peerConnection.addTrack(track, stream);
          }
        });

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socketRef.current?.emit("webrtc:answer", {
          targetUserId,
          answer,
        });
        setCallStatus("connecting");
      } catch (error) {
        toast.error(error.message || "Could not answer the call");
        resetCallState();
      }
    };

    const handleAnswer = async ({ fromUserId, answer }) => {
      if (fromUserId !== targetUserId || !peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setCallStatus("connecting");
      } catch (error) {
        toast.error(error.message || "Could not connect the call");
        resetCallState();
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }) => {
      if (fromUserId !== targetUserId || !peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    };

    socketRef.current.on("messageReceived", handleMessageReceived);
    socketRef.current.on("messagesSeen", handleMessagesSeen);
    socketRef.current.on("presence:update", handlePresenceUpdate);
    socketRef.current.on("call:accepted", handleCallAccepted);
    socketRef.current.on("call:rejected", handleCallRejected);
    socketRef.current.on("call:ended", handleCallEnded);
    socketRef.current.on("webrtc:offer", handleOffer);
    socketRef.current.on("webrtc:answer", handleAnswer);
    socketRef.current.on("webrtc:ice-candidate", handleIceCandidate);

    return () => {
      socketRef.current?.off("messageReceived", handleMessageReceived);
      socketRef.current?.off("messagesSeen", handleMessagesSeen);
      socketRef.current?.off("presence:update", handlePresenceUpdate);
      socketRef.current?.off("call:accepted", handleCallAccepted);
      socketRef.current?.off("call:rejected", handleCallRejected);
      socketRef.current?.off("call:ended", handleCallEnded);
      socketRef.current?.off("webrtc:offer", handleOffer);
      socketRef.current?.off("webrtc:answer", handleAnswer);
      socketRef.current?.off("webrtc:ice-candidate", handleIceCandidate);
    };
  }, [targetUserId, user?._id]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        setLoadingChat(true);
        const res = await api.get(`/chat/${targetUserId}`);
        setActiveChat(res.data.chat);
        setMessages(res.data.chat?.messages || []);
        socketRef.current?.emit("joinChat", { targetUserId });
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to open chat");
        navigate("/chat", { replace: true });
      } finally {
        setLoadingChat(false);
      }
    };

    loadChat();

    return () => {
      socketRef.current?.emit("leaveChat", { targetUserId });
      handleEndCall();
    };
  }, [targetUserId, navigate]);

  useEffect(() => {
    if (!location.state?.autoAnswer || !targetUserId || handledAutoAnswerRef.current) {
      return;
    }

    handledAutoAnswerRef.current = true;

    const answerIncomingCall = async () => {
      try {
        await ensureLocalMedia(location.state.callType);
        setCallStatus("connecting");
        socketRef.current?.emit("acceptCall", {
          targetUserId,
          callType: location.state.callType,
        });
        navigate(location.pathname, { replace: true, state: null });
      } catch (error) {
        toast.error(error.message || "Could not answer the call");
        resetCallState();
      }
    };

    answerIncomingCall();
  }, [location.pathname, location.state, navigate, targetUserId]);

  useEffect(() => {
    handledAutoAnswerRef.current = false;
  }, [targetUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      220
    )}px`;
  }, [draft]);

  useEffect(() => {
    attachLocalStream(localStreamRef.current);
  }, [localReady, callType]);

  useEffect(() => {
    attachRemoteStream(remoteStreamRef.current);
  }, [remoteReady, callType]);

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!draft.trim() || !targetUserId || !socketRef.current) return;

    setSending(true);

    socketRef.current.emit(
      "sendMessage",
      {
        targetUserId,
        text: draft,
      },
      (response) => {
        setSending(false);

        if (!response?.success) {
          toast.error(response?.message || "Message send failed");
          return;
        }

        setMessages((current) => {
          const alreadyExists = current.some(
            (item) => item._id === response.message._id
          );

          if (alreadyExists) return current;

          return [...current, response.message];
        });

        setDraft("");
      }
    );
  };

  return (
    <section className="flex h-[calc(100dvh-8.5rem)] max-h-[calc(100dvh-8.5rem)] min-h-[60vh] flex-col overflow-hidden rounded-3xl border border-dark-500 bg-dark-700 lg:h-[calc(100dvh-3rem)] lg:max-h-[calc(100dvh-3rem)]">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-dark-500 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="rounded-2xl border border-dark-400 px-3 py-2 text-sm text-slate-200"
          >
            Back
          </button>

          {activeUser ? (
            <>
              <UserAvatar user={activeUser} size="md" />
              <div className="min-w-0">
                <Link
                  to={`/profile/${activeUser._id}`}
                  className="inline-flex items-center gap-1 truncate font-semibold text-white hover:text-brand-300"
                >
                  {activeUser.name}
                  <PremiumBadge user={activeUser} size="sm" />
                </Link>
                <div className="flex items-center gap-2">
                  {activeUser.isOnline ? (
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  ) : null}
                  <p className="truncate text-sm text-slate-400">
                    {activeUser.isOnline
                      ? "Active now"
                      : activeUser.headline || "Developer on DevNetwork"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-white">Chat</p>
              <p className="text-sm text-slate-400">Loading chat...</p>
            </div>
          )}
        </div>

        {activeUser ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => startOutgoingCall("audio")}
              disabled={callStatus !== "idle"}
              className="rounded-2xl border border-dark-400 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Audio call
            </button>
            <button
              type="button"
              onClick={() => startOutgoingCall("video")}
              disabled={callStatus !== "idle"}
              className="rounded-2xl border border-dark-400 px-4 py-2 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Video call
            </button>
            <Link
              to={`/profile/${activeUser._id}`}
              className="rounded-2xl border border-dark-400 px-4 py-2 text-sm text-slate-200"
            >
              View profile
            </Link>
          </div>
        ) : null}
      </div>

      {callStatus !== "idle" ? (
        <div className="shrink-0 border-b border-dark-500 bg-dark-800/70 px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-semibold text-white">
                {getCallLabel(callType)} {callStatus === "active" ? "in progress" : "starting"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {callStatus === "calling"
                  ? `Calling ${activeUser?.name || "developer"}...`
                  : callStatus === "connecting"
                    ? "Connecting call..."
                    : "Call connected"}
              </p>
              {callError ? <p className="mt-1 text-sm text-rose-300">{callError}</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <div className={`grid gap-3 ${callType === "video" ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                <div className="overflow-hidden rounded-2xl border border-dark-500 bg-dark-900">
                  {callType === "video" ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-40 w-56 bg-black object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-48 items-center justify-center text-sm text-slate-400">
                      Your microphone is on
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-dark-500 bg-dark-900">
                  {callType === "video" ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="h-40 w-56 bg-black object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-48 items-center justify-center text-sm text-slate-400">
                      {remoteReady ? "Connected audio" : "Waiting for the other user..."}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleEndCall(true)}
                className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
              >
                End call
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-4">
          {loadingChat ? (
            <div className="text-sm text-slate-400">Loading messages...</div>
          ) : messages.length ? (
            messages.map((message) => {
              const isOwnMessage =
                message.senderId?._id?.toString() === user?._id?.toString();

              return (
                <div
                  key={message._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                      isOwnMessage
                        ? "bg-brand-500 text-white"
                        : "bg-dark-800 text-slate-100"
                    }`}
                  >
                    {!isOwnMessage ? (
                      <p className="mb-1 text-xs font-medium text-brand-300">
                        <span className="inline-flex items-center gap-1">
                          {message.senderId?.name}
                          <PremiumBadge user={message.senderId} size="sm" />
                        </span>
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {message.text}
                    </p>
                    <p
                      className={`mt-2 flex items-center justify-end gap-1 text-right text-[11px] ${
                        isOwnMessage ? "text-white/70" : "text-slate-500"
                      }`}
                    >
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isOwnMessage ? <MessageTicks seen={message.seen} /> : null}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dark-500 bg-dark-800 p-4 text-sm text-slate-400">
              No messages yet. Send the first message.
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={handleSendMessage}
        className="shrink-0 border-t border-dark-500 px-5 py-4"
      >
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message..."
            rows={1}
            className="max-h-[220px] min-h-12 flex-1 resize-none overflow-y-auto rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}

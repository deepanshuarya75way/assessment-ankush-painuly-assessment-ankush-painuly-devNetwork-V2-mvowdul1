import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import UserAvatar from "../components/UserAvatar";
import PremiumBadge from "../components/PremiumBadge";
import { connectAppSocket } from "../socket/appSocket";

const formatDateTime = (dateString) => {
  if (!dateString) return "";

  return new Date(dateString).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function Chat() {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const sortedChatList = useMemo(
    () =>
      [...chatList].sort(
        (first, second) =>
          new Date(second.lastMessageAt || 0) - new Date(first.lastMessageAt || 0)
      ),
    [chatList]
  );

  useEffect(() => {
    const loadChatList = async () => {
      try {
        setLoadingList(true);
        const res = await api.get("/chat/list");
        setChatList(res.data.chats || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load chats");
      } finally {
        setLoadingList(false);
      }
    };

    loadChatList();
  }, []);

  useEffect(() => {
    const socket = connectAppSocket();

    const handlePresenceUpdate = ({ userId, isOnline, lastSeen }) => {
      setChatList((current) =>
        current.map((item) =>
          item.otherUser?._id === userId
            ? {
                ...item,
                otherUser: {
                  ...item.otherUser,
                  isOnline,
                  lastSeen,
                },
              }
            : item
        )
      );
    };

    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-dark-500 bg-dark-700 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-white">Chats</h1>
        <p className="mt-1 text-sm text-slate-400">
          Open any conversation and start chatting.
        </p>
      </div>

      {loadingList ? (
        <div className="rounded-2xl border border-dark-500 bg-dark-800 p-4 text-sm text-slate-400">
          Loading chats...
        </div>
      ) : sortedChatList.length ? (
        <div className="space-y-3">
          {sortedChatList.map((item) => (
            <button
              key={item.otherUser?._id}
              type="button"
              onClick={() => navigate(`/chat/${item.otherUser?._id}`)}
              className="w-full rounded-2xl border border-dark-500 bg-dark-800 p-4 text-left transition hover:border-dark-400"
            >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <UserAvatar user={item.otherUser} size="md" />
                    {item.otherUser?.isOnline ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-dark-800 bg-emerald-400" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-1 truncate font-semibold text-white">
                        {item.otherUser?.name}
                        <PremiumBadge user={item.otherUser} size="sm" />
                      </p>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatDateTime(item.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-400">
                    {item.lastMessage || "Start the conversation"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dark-500 bg-dark-800 p-5 text-center">
          <h2 className="text-lg font-semibold text-white">No chats yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Open any accepted connection and tap Chat to start.
          </p>
          <Link
            to="/connections"
            className="mt-4 inline-flex rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
          >
            Go to connections
          </Link>
        </div>
      )}
    </div>
  );
}

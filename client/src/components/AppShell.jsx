import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import { clearUser } from "../features/auth/userSlice";
import UserAvatar from "./UserAvatar";
import { connectAppSocket, disconnectAppSocket } from "../socket/appSocket";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/feed", label: "Feed" },
  { to: "/explore", label: "Explore" },
  { to: "/connections", label: "Connections" },
  { to: "/chat", label: "Chat" },
  { to: "/premium", label: "Premium" },
  { to: "/requests", label: "Requests" },
];

const moreItems = [
  { to: (userId) => `/followers/${userId}`, label: "Followers" },
  { to: (userId) => `/following/${userId}`, label: "Following" },
  { to: () => "/saved", label: "Saved" },
  { to: () => "/blocked", label: "Blocked" },
];

export default function AppShell({ children }) {
  const { user } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    const socket = connectAppSocket();
    const handleConnectError = () => {
      toast.error("Realtime connection failed");
    };

    const handleIncomingCall = ({ fromUser, callType }) => {
      setIncomingCall({ fromUser, callType });
    };

    const handleCallEnded = ({ fromUserId }) => {
      setIncomingCall((current) =>
        current?.fromUser?._id === fromUserId ? null : current
      );
    };

    const handleCallRejected = ({ fromUserId }) => {
      setIncomingCall((current) =>
        current?.fromUser?._id === fromUserId ? null : current
      );
    };

    socket.on("connect_error", handleConnectError);
    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:rejected", handleCallRejected);

    return () => {
      socket.off("connect_error", handleConnectError);
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:rejected", handleCallRejected);
      disconnectAppSocket();
    };
  }, [user?._id]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      disconnectAppSocket();
      dispatch(clearUser());
      toast.success("Logged out");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const handleRejectIncomingCall = () => {
    if (!incomingCall?.fromUser?._id) return;

    connectAppSocket().emit("rejectCall", {
      targetUserId: incomingCall.fromUser._id,
    });
    setIncomingCall(null);
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall?.fromUser?._id) return;

    const acceptedCall = incomingCall;
    setIncomingCall(null);
    navigate(`/chat/${acceptedCall.fromUser._id}`, {
      state: {
        autoAnswer: true,
        callType: acceptedCall.callType,
      },
      replace: location.pathname === `/chat/${acceptedCall.fromUser._id}`,
    });
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100">
      {incomingCall ? (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md rounded-3xl border border-brand-400/30 bg-dark-700/95 p-4 shadow-[0_18px_50px_rgba(8,8,16,0.45)] backdrop-blur">
          <div className="flex items-start gap-3">
            <UserAvatar user={incomingCall.fromUser} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Incoming {incomingCall.callType} call</p>
              <p className="truncate text-sm text-slate-300">{incomingCall.fromUser.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {incomingCall.fromUser.headline || "Developer on DevNetwork"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleRejectIncomingCall}
              className="flex-1 rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm font-medium text-slate-200"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              className="flex-1 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6 lg:py-6">
        <div className="sticky top-0 z-30 -mx-4 border-b border-dark-500 bg-dark-900/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">DevNetwork</h1>
              <p className="text-xs text-slate-400">Build with developers</p>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <button
                type="button"
                onClick={() => navigate(`/profile/${user?._id}`)}
                className="rounded-2xl border border-dark-400 p-1.5"
              >
                <UserAvatar user={user} size="sm" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-dark-400 px-3 py-2 text-xs font-medium text-slate-200"
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "bg-dark-700 text-slate-300"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <aside className="hidden w-full rounded-3xl border border-dark-500 bg-dark-700/80 p-5 lg:sticky lg:top-6 lg:block lg:h-fit lg:w-72">
          <div className="mb-8 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-xl font-bold text-brand-300">
                D
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">DevNetwork</h1>
                <p className="text-sm text-slate-400">Build with developers</p>
              </div>
            </div>
            <ThemeToggle compact />
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dark-500 bg-dark-800 p-3">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{user?.name}</p>
              <p className="truncate text-sm text-slate-400">
                {user?.headline || "Complete your profile"}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-500 text-white"
                      : "text-slate-300 hover:bg-dark-600 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to={`/profile/${user?._id}`}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : "text-slate-300 hover:bg-dark-600 hover:text-white"
                }`
              }
            >
              My Profile
            </NavLink>
          </nav>

          <div className="mt-3 rounded-2xl border border-dark-500 bg-dark-800">
            <button
              type="button"
              onClick={() => setShowMore((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-200"
            >
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-300">
                  <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                More
              </span>
              <span className="text-slate-400">{showMore ? "-" : "+"}</span>
            </button>
            {showMore && (
              <div className="space-y-2 border-t border-dark-500 px-3 py-3">
                {moreItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to(user?._id)}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-brand-500 text-white"
                          : "text-slate-300 hover:bg-dark-600 hover:text-white"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 w-full rounded-2xl border border-dark-400 bg-dark-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-brand-500 hover:text-white"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

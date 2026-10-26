import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import VerifyOTP from "./pages/auth/VerifyOTP";
import Feed from "./pages/Feed";
import ForgotPassword from "./pages/auth/ForgotPassword";
import GoogleSuccess from "./pages/auth/GoogleSuccess";
import { setUser } from "./features/auth/userSlice";
import api from "./api/axios";
import AppShell from "./components/AppShell";
import Explore from "./pages/Explore";
import Connections from "./pages/Connections";
import Requests from "./pages/Requests";
import SavedPosts from "./pages/SavedPosts";
import Profile from "./pages/Profile";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import BlockedUsers from "./pages/BlockedUsers";
import Chat from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import Premium from "./pages/Premium";
import Landing from "./pages/Landing";

function PublicRoute({ children }) {
  const { user } = useSelector((store) => store.user);

  return !user ? children : <Navigate to="/feed" replace />;
}

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.user);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    if (user) return;

    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        dispatch(setUser(res.data.user));
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <svg
          className="animate-spin w-8 h-8 text-brand-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  return children;
};

function ProtectedShell() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Outlet />
      </AppShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/auth/google/success"
        element={
          <ProtectedRoute>
            <GoogleSuccess />
          </ProtectedRoute>
        }
      />
      <Route element={<ProtectedShell />}>
        <Route path="/feed" element={<Feed />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:userId" element={<ChatConversation />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/saved" element={<SavedPosts />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/followers/:userId" element={<Followers />} />
        <Route path="/following/:userId" element={<Following />} />
        <Route path="/blocked" element={<BlockedUsers />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

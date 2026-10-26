import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUser } from "../../features/auth/userSlice";

const googleAuthUrl = `${api.defaults.baseURL}/auth/google`;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email:    "",
    password: "",
  });

  const [searchParams] = useSearchParams();

useEffect(() => {
  const error = searchParams.get("error");
  if (error === "google_failed") {
    toast.error("Google login failed. Please try again.");
  }
}, []);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);

  // ─── HANDLE INPUT CHANGE ──────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ─── HANDLE SUBMIT ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim())    return toast.error("Email is required");
    if (!form.password.trim()) return toast.error("Password is required");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", form);
      dispatch(setUser(res.data.user));
      toast.success("Welcome back!");
      navigate("/feed", { replace: true });
    } catch (err) {
      const data = err.response?.data;

      // ─── NEEDS VERIFICATION ───────────────────────────
      // User signed up but never verified OTP
      if (data?.needsVerification) {
        toast.error("Please verify your email first");
        navigate(`/verify-otp?userId=${data.userId}`, { replace: true });
        return;
      }

      toast.error(data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ─── GOOGLE LOGIN ─────────────────────────────────────
  const handleGoogleLogin = () => {
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(220,252,231,0.95),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(233,213,255,0.45),_transparent_24%),linear-gradient(180deg,_#fafcf9,_#f3f6f3)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── LOGO ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-emerald-600 tracking-tight">
            DevNetwork
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            The developer social platform
          </p>
        </div>

        {/* ── CARD ── */}
        <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(148,163,184,0.16)] backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Sign in to your account
          </p>

          {/* ── GOOGLE BUTTON ── */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3
                       bg-white hover:bg-emerald-50 border border-slate-200
                       text-slate-700 rounded-lg py-3 text-sm font-medium
                       transition-all duration-200 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* ── DIVIDER ── */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-600 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@gmail.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800
                           placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1
                           focus:ring-brand-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1
                             focus:ring-brand-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-500 hover:text-slate-700 text-xs
                             transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50
                         disabled:cursor-not-allowed text-white font-medium py-3
                         rounded-lg transition-all duration-200 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* ── FOOTER ── */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
}

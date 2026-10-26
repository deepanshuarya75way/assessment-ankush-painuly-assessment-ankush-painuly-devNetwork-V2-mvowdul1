import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]           = useState(1); // 1 = email, 2 = otp + new password
  const [email, setEmail]         = useState("");
  const [userId, setUserId]       = useState(null);
  const [otp, setOtp]             = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs                 = useRef([]);

  // ─── COUNTDOWN TIMER ──────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ─── STEP 1 — SEND OTP ────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email is required");

    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", { email });
      setUserId(res.data.userId);
      setCountdown(60);
      toast.success("OTP sent to your email!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP INPUT HANDLERS ───────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;//if not digit
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => { newOtp[i] = digit; });
    setOtp(newOtp);
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // ─── STEP 2 — RESET PASSWORD ──────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length < 6)    return toast.error("Please enter complete OTP");
    if (newPassword.length < 6)  return toast.error("Password must be at least 6 characters");

    try {
      setLoading(true);
      await api.post("/auth/reset-password", {
        userId,
        otp: otpString,
        newPassword,
      });
      toast.success("Password reset successfully!");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── RESEND OTP ───────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("New OTP sent!");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const waitSeconds = err.response?.data?.waitSeconds;
      if (waitSeconds) setCountdown(waitSeconds);
      toast.error(err.response?.data?.message || "Failed to resend");
    }
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

        <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(148,163,184,0.16)] backdrop-blur">

          {/* ── STEP INDICATOR ── */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
              ${step >= 1 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              1
            </div>
            <div className={`flex-1 h-px ${step >= 2 ? "bg-brand-500" : "bg-slate-200"}`}></div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
              ${step >= 2 ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500"}`}>
              2
            </div>
          </div>

          {/* ════════════════════════════════════════════
              STEP 1 — ENTER EMAIL
          ════════════════════════════════════════════ */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Forgot password?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter your email and we'll send you a reset OTP.
              </p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@gmail.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800
                               placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1
                               focus:ring-brand-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50
                             disabled:cursor-not-allowed text-white font-medium py-3
                             rounded-lg transition-all duration-200 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            </>
          )}

          {/* ════════════════════════════════════════════
              STEP 2 — OTP + NEW PASSWORD
          ════════════════════════════════════════════ */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Reset your password
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Enter the OTP sent to{" "}
                <span className="text-emerald-600">{email}</span>
                {" "}and your new password.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">

                {/* OTP Boxes */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-3">
                    Enter OTP
                  </label>
                  <div className="flex gap-3 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={`w-12 h-14 text-center text-xl font-semibold
                                   rounded-lg border transition-all outline-none
                                   bg-white text-slate-900
                                   ${digit
                                     ? "border-brand-500 bg-brand-50 text-emerald-600"
                                     : "border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                   }`}
                      />
                    ))}
                  </div>

                  {/* Resend */}
                  <div className="mt-3 text-right">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0}
                      className="text-xs font-medium transition-colors
                                 disabled:cursor-not-allowed
                                 text-emerald-600 hover:text-emerald-700
                                 disabled:text-slate-600"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-800
                                 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1
                                 focus:ring-brand-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6 || newPassword.length < 6}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50
                             disabled:cursor-not-allowed text-white font-medium py-3
                             rounded-lg transition-all duration-200 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    "Reset password"
                  )}
                </button>
              </form>

              {/* Back to step 1 */}
              <button
                onClick={() => { setStep(1); setOtp(["","","","","",""]); }}
                className="w-full text-center text-slate-500 hover:text-slate-700
                           text-sm mt-4 transition-colors"
              >
                ← Use different email
              </button>
            </>
          )}

        </div>

        {/* ── FOOTER ── */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

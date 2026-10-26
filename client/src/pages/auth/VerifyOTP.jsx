import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { setUser } from "../../features/auth/userSlice";

export default function VerifyOTP() {
  const navigate                      = useNavigate();
  const dispatch                      = useDispatch();
  const [searchParams]                = useSearchParams();
  const userId                        = searchParams.get("userId");

  const [otp, setOtp]                 = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const inputRefs                     = useRef([]);

  // ─── REDIRECT IF NO USERID ────────────────────────────
  useEffect(() => {
    if (!userId) navigate("/signup", { replace: true });
  }, [userId]);

  // ─── COUNTDOWN TIMER ──────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ─── HANDLE OTP INPUT ─────────────────────────────────
  const handleChange = (index, value) => {
    // only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only one digit per box
    setOtp(newOtp);

    // auto focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ─── HANDLE BACKSPACE ─────────────────────────────────
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ─── HANDLE PASTE ─────────────────────────────────────
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);

    // focus last filled box
    const lastIndex = Math.min(pasted.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  // ─── HANDLE SUBMIT ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length < 6) return toast.error("Please enter complete OTP");

    try {
      setLoading(true);
      const res = await api.post("/auth/verify-otp", { userId, otp: otpString });
      dispatch(setUser(res.data.user));
      toast.success("Account verified successfully!");
      navigate("/feed", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      // clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── HANDLE RESEND ────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      setResending(true);
      const res = await api.post("/auth/resend-otp", { userId });
      toast.success("New OTP sent!");
      setCountdown(60); // 60 second cooldown
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const waitSeconds = err.response?.data?.waitSeconds;
      if (waitSeconds) {
        setCountdown(waitSeconds); // sync with backend cooldown
      }
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
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

        {/* ── CARD ── */}
        <div className="rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(148,163,184,0.16)] backdrop-blur">

          {/* Icon */}
          <div className="w-14 h-14 bg-brand-50 border border-emerald-100
                          rounded-2xl flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 mb-1">
            Verify your email
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            We sent a 6-digit code to your email.
            Enter it below to verify your account.
          </p>

          {/* ── OTP FORM ── */}
          <form onSubmit={handleSubmit}>

            {/* OTP Boxes */}
            <div className="flex gap-3 justify-between mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
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
                  Verifying...
                </span>
              ) : (
                "Verify account"
              )}
            </button>
          </form>

          {/* ── RESEND ── */}
          <div className="text-center mt-5">
            <span className="text-slate-500 text-sm">
              Didn't receive it?{" "}
            </span>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-sm font-medium transition-colors
                         disabled:cursor-not-allowed
                         text-emerald-600 hover:text-emerald-700
                         disabled:text-slate-600"
            >
              {resending
                ? "Sending..."
                : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend OTP"
              }
            </button>
          </div>

        </div>

        {/* ── BACK TO SIGNUP ── */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Wrong email?{" "}
          <button
            onClick={() => navigate("/signup", { replace: true })}
            className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            Go back
          </button>
        </p>

      </div>
    </div>
  );
}

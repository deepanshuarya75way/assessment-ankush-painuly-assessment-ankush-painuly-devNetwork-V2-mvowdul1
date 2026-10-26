import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import api from "../api/axios";
import { setUser } from "../features/auth/userSlice";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Premium() {
  const { user } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [processingPlan, setProcessingPlan] = useState("");
  const [checkingPremium, setCheckingPremium] = useState(false);

  const currentPlan = user?.subscription?.plan || "free";
  const isPremium = currentPlan !== "free";

  const verifyPremiumUser = async ({ silent = false } = {}) => {
    try {
      setCheckingPremium(true);
      const res = await api.get("/payments/premium/verify");

      if (res.data.isPremium) {
        dispatch(setUser(res.data.user));
        if (!silent) {
          toast.success("Premium plan activated");
        }
      } else if (!silent) {
        toast("Payment received. Premium will update after webhook.");
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.message || "Could not verify premium");
      }
    } finally {
      setCheckingPremium(false);
      setProcessingPlan("");
    }
  };

  useEffect(() => {
    if (isPremium) return;
    verifyPremiumUser({ silent: true });
  }, []);

  const handleBuyClick = async (plan) => {
    try {
      setProcessingPlan(plan);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay checkout");
        setProcessingPlan("");
        return;
      }

      const res = await api.post("/payments/create", { plan });
      const { keyId, amount, currency, notes, orderId, planLabel, durationDays } =
        res.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevNetwork",
        description: `${planLabel} plan for ${durationDays} days`,
        order_id: orderId,
        prefill: {
          name: notes.name,
          email: notes.email,
        },
        theme: {
          color: "#6366f1",
        },
        handler: async () => {
          await verifyPremiumUser({ silent: false });
        },
        modal: {
          ondismiss: () => setProcessingPlan(""),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start payment");
      setProcessingPlan("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-dark-500 bg-gradient-to-br from-dark-700 via-dark-700 to-dark-800 p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
              Premium
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-white lg:text-4xl">
              Upgrade your DevNetwork profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 lg:text-base">
              Get better visibility, a stronger profile presence, and premium
              features that help you stand out faster.
            </p>
          </div>

          <div className="rounded-3xl border border-dark-500 bg-dark-800/80 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Current plan
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </p>
            {user?.subscription?.endDate && (
              <p className="mt-2 text-sm text-slate-400">
                Active until{" "}
                {new Date(user.subscription.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </section>

      {isPremium ? (
        <section className="rounded-3xl border border-emerald-500/20 bg-dark-700 p-8 text-center">
          <h2 className="text-3xl font-semibold text-white">
            Your premium plan is active
          </h2>
          <p className="mt-3 text-slate-400">
            You are currently on the{" "}
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-dark-500 bg-dark-700 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-white">Pro</h2>
                <p className="mt-2 text-slate-400">
                  Great for developers who want better reach and a cleaner
                  premium profile.
                </p>
              </div>
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                Rs 499
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>- Chat with developers</li>
              <li>- Better developer visibility</li>
              <li>- Verified badge</li>
              <li>- 30 days access</li>
            </ul>

            <button
              type="button"
              onClick={() => handleBuyClick("pro")}
              disabled={processingPlan === "pro" || checkingPremium}
              className="mt-8 w-full rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingPlan === "pro" ? "Opening checkout..." : "Buy Pro"}
            </button>
          </article>

          <article className="rounded-3xl border border-brand-500/25 bg-gradient-to-b from-dark-700 to-dark-800 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-white">Elite</h2>
                <p className="mt-2 text-slate-400">
                  Best for developers who want maximum premium visibility on the
                  platform.
                </p>
              </div>
              <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                Rs 999
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>- All Pro features</li>
              <li>- Higher profile priority</li>
              <li>- Stronger premium visibility</li>
              <li>- Verified badge</li>
              <li>- 30 days access</li>
            </ul>

            <button
              type="button"
              onClick={() => handleBuyClick("elite")}
              disabled={processingPlan === "elite" || checkingPremium}
              className="mt-8 w-full rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingPlan === "elite" ? "Opening checkout..." : "Buy Elite"}
            </button>
          </article>
        </div>
      )}
    </div>
  );
}

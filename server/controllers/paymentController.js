import Payment from "../models/payment.js";
import User from "../models/user.js";
import {
  createRazorpayOrder,
  ensureRazorpayConfig,
  validateWebhookSignature,
} from "../utils/razorpay.js";

const PLAN_DETAILS = {
  pro: {
    label: "Pro",
    amount: 499,
    durationDays: 30,
  },
  elite: {
    label: "Elite",
    amount: 999,
    durationDays: 30,
  },
};

export const createPayment = async (req, res) => {
  try {
    ensureRazorpayConfig();

    const { plan } = req.body;
    const selectedPlan = PLAN_DETAILS[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    const order = await createRazorpayOrder({
      amount: selectedPlan.amount * 100,
      receipt: `dn_${Date.now()}`,
      currency: "INR",
      notes: {
        name: req.user.name,
        email: req.user.email,
        plan,
      },
    });

    const payment = await Payment.create({
      user: req.user._id,
      plan,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.id,
      status: order.status || "created",
    });

    res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      planLabel: selectedPlan.label,
      durationDays: selectedPlan.durationDays,
      paymentId: payment._id,
      notes: order.notes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const paymentWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;

    const isValid = validateWebhookSignature(rawBody, signature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is invalid",
      });
    }

    const payload = JSON.parse(rawBody.toString("utf8"));

    if (payload.event === "payment.captured") {
      const paymentDetails = payload.payload.payment.entity;
      const payment = await Payment.findOne({
        razorpayOrderId: paymentDetails.order_id,
      });

        if (payment) {
        payment.status = "paid";
        payment.razorpayPaymentId = paymentDetails.id;
        payment.paidAt = new Date();
        await payment.save();

        const user = await User.findById(payment.user);
        const selectedPlan = PLAN_DETAILS[payment.plan];

        if (user && selectedPlan) {
          const startDate = new Date();
          const endDate = new Date(
            startDate.getTime() +
              selectedPlan.durationDays * 24 * 60 * 60 * 1000
          );

          user.subscription = {
            plan: payment.plan,
            startDate,
            endDate,
            razorpaySubscriptionId: "",
          };

          await user.save();
        }
      }
    }

    if (payload.event === "payment.failed") {
      const paymentDetails = payload.payload.payment.entity;

      await Payment.findOneAndUpdate(
        { razorpayOrderId: paymentDetails.order_id },
        {
          status: "failed",
          razorpayPaymentId: paymentDetails.id || "",
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Webhook received successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyPremium = async (req, res) => {
  const user = req.user;
  const currentPlan = user.subscription?.plan || "free";

  if (currentPlan !== "free") {
    return res.status(200).json({
      success: true,
      isPremium: true,
      user,
    });
  }

  return res.status(200).json({
    success: true,
    isPremium: false,
  });
};

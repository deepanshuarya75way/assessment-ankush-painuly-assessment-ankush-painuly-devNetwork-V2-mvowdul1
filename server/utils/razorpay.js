import crypto from "crypto";

const createBasicAuthHeader = () => {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  return `Basic ${credentials}`;
};

export const ensureRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are not configured");
  }
};

export const createRazorpayOrder = async (options) => {
  ensureRazorpayConfig();

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createBasicAuthHeader(),
    },
    body: JSON.stringify(options),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.description || "Failed to create payment order");
  }

  return data;
};

export const validateWebhookSignature = (rawBody, signature) => {
  if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
};

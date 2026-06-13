import crypto from "node:crypto";
import Razorpay from "razorpay";

const PLATFORM_FEE = 15;
const GST_AMOUNT = 2.7;

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getGatewayConfig() {
  const client = getRazorpayClient();

  return {
    provider: "razorpay",
    mode: client ? "live" : "demo",
    keyId: process.env.RAZORPAY_KEY_ID || "demo_key",
    platformFee: PLATFORM_FEE,
    gstAmount: GST_AMOUNT,
  };
}

export function getPaymentTotals(amount) {
  const total = Number((amount + PLATFORM_FEE + GST_AMOUNT).toFixed(2));
  return {
    subtotal: amount,
    platformFee: PLATFORM_FEE,
    gstAmount: GST_AMOUNT,
    total,
  };
}

export async function createOrder({ billId, amount, residentName }) {
  const config = getGatewayConfig();
  if (config.mode === "demo") {
    return {
      id: `order_demo_${Date.now()}`,
      amount: Math.round(configuredTotal(amount) * 100),
      currency: "INR",
      receipt: billId,
      notes: {
        residentName,
        mode: "demo",
      },
      mode: "demo",
    };
  }

  const client = getRazorpayClient();
  const totals = getPaymentTotals(amount);
  const order = await client.orders.create({
    amount: Math.round(totals.total * 100),
    currency: "INR",
    receipt: billId,
    notes: {
      residentName,
      source: "SocietyConnect",
    },
  });

  return { ...order, mode: "live" };
}

export function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return false;
  }

  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generated === signature;
}

function configuredTotal(amount) {
  return getPaymentTotals(amount).total;
}

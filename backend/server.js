import "dotenv/config";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getGoogleClientId,
  isGoogleConfigured,
  requireAuth,
  requireAdmin,
  sanitizeResident,
  signToken,
  verifyGoogleCredential,
  verifyPassword,
} from "./lib/auth.js";
import {
  getGatewayConfig,
  getPaymentTotals,
  createOrder,
  verifySignature,
} from "./lib/payment.js";
import { readStore, updateStore } from "./lib/store.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "..", "dist");

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowParts() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function createComplaintId() {
  // 6-digit to reduce collision probability
  return `C-${Math.floor(Math.random() * 900000 + 100000)}`;
}

function createHistoryId() {
  return `H${Date.now()}`;
}

function createTransactionId() {
  return `TXN${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
}

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function findResident(store, id) {
  return store.residents.find((r) => r.id === id) || null;
}

function ensureResident(store, id) {
  const r = findResident(store, id);
  if (!r) throw new Error("Resident not found");
  return r;
}

function buildBootstrapPayload(resident, store) {
  return {
    resident: sanitizeResident(resident),
    complaints: resident.complaints || [],
    bills: resident.bills || [],
    history: resident.history || [],
    notifications: resident.notifications || [],
    scheduleEvents: store.scheduleEvents || [],
    bookings: resident.bookings || [],
    faqs: store.faqs || [],
    paymentGateway: getGatewayConfig(),
  };
}

function pushNotification(resident, notification) {
  if (!Array.isArray(resident.notifications)) resident.notifications = [];
  resident.notifications.unshift({ id: Date.now(), read: false, ...notification });
}

function pushHistory(resident, entry) {
  if (!Array.isArray(resident.history)) resident.history = [];
  resident.history.unshift({ id: createHistoryId(), ...entry });
}

function buildChatReply(message, faqs) {
  const text = message.toLowerCase();
  const match = (faqs || []).find(
    (faq) =>
      faq.q.toLowerCase().includes(text) || faq.a.toLowerCase().includes(text),
  );
  if (match) return match.a;
  if (text.includes("bill") || text.includes("payment"))
    return "Aap Payments section se invoice dekh sakte ho aur unpaid bill ko seedha checkout se clear kar sakte ho.";
  if (text.includes("complaint") || text.includes("issue") || text.includes("repair"))
    return "Complaint section me new request raise kijiye. Title, category aur description bharte hi woh maintenance team ko chali jayegi.";
  if (text.includes("booking") || text.includes("hall") || text.includes("gym"))
    return "Schedule page se facility request bheji ja sakti hai. Approval ke baad woh aapki activity history me bhi reflect ho jayegi.";
  return "Support team ne aapka message note kar liya hai. Agar issue maintenance, billing ya booking se related hai to main usme turant help kar sakta hoon.";
}

async function markBillPaid(residentId, { billId, paymentId, paymentMethod, paymentSource }) {
  return updateStore((store) => {
    const resident = ensureResident(store, residentId);
    const bill = (resident.bills || []).find((b) => b.id === billId);
    if (!bill) throw new Error("Bill not found");
    if (bill.status === "Paid") return store; // idempotent

    const { date, time } = nowParts();
    const totals = getPaymentTotals(bill.amount);

    bill.status = "Paid";
    bill.lastTransaction = {
      paymentId,
      paymentMethod,
      paymentSource,
      paidAt: `${date} ${time}`,
      totalPaid: totals.total,
    };

    pushNotification(resident, {
      icon: "payments",
      title: `Payment of ${formatCurrency(totals.total)} successful`,
      time: "Just now",
    });
    pushHistory(resident, {
      type: "Payment",
      icon: "payments",
      title: `${bill.type} - ${bill.period}`,
      ref: bill.id,
      date,
      time,
      status: "Paid",
      amount: formatCurrency(totals.total),
    });
    return store;
  });
}

// ── Public routes ─────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/config", (_req, res) => {
  res.json({
    googleClientId: getGoogleClientId() || null,
    googleEnabled: isGoogleConfigured(),
  });
});

// Register new resident
app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, phone, unit } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !unit?.trim()) {
      return res.status(400).json({ message: "Name, email, password and unit are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const store = await readStore();
    const exists = store.residents.find(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const { date } = nowParts();
    const passwordHash = await bcrypt.hash(password, 10);

    const newResident = {
      id: `res-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      unit: unit.trim(),
      googleId: null,
      passwordHash,
      status: "pending",
      joinedAt: date,
      preferences: { complaints: true, payments: true, notices: true, schedule: false },
      complaints: [],
      bills: [],
      history: [],
      notifications: [
        {
          id: Date.now(),
          read: false,
          icon: "waving_hand",
          title: `Welcome to SocietyConnect, ${name.trim()}!`,
          time: "Just now",
        },
      ],
      bookings: [],
    };

    await updateStore((s) => {
      s.residents.push(newResident);
      return s;
    });

    res.status(201).json({
      message:
        "Registration submitted. Please wait for admin approval before signing in.",
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const store = await readStore();
    const resident = store.residents.find(
      (r) => r.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!resident) return res.status(401).json({ message: "Invalid email or password." });

    const valid = await verifyPassword(password, resident.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid email or password." });

    if (resident.status === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is pending admin approval. Please check back soon." });
    }
    if (resident.status === "suspended") {
      return res
        .status(403)
        .json({ message: "Your account has been suspended. Contact the admin." });
    }

    res.json({ token: signToken(resident), resident: sanitizeResident(resident) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: "Google credential is required." });

    const payload = await verifyGoogleCredential(credential);
    const store = await readStore();
    const resident = store.residents.find(
      (r) =>
        r.email.toLowerCase() === payload.email.toLowerCase() ||
        (r.googleId && r.googleId === payload.sub),
    );

    if (!resident) {
      return res.status(403).json({
        message: "This Google account is not registered. Please register first.",
      });
    }
    if (resident.status === "pending") {
      return res
        .status(403)
        .json({ message: "Your account is pending admin approval." });
    }
    if (resident.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended." });
    }

    const nextStore = await updateStore((s) => {
      const r = findResident(s, resident.id);
      if (!r) throw new Error("Resident not found");
      r.googleId = payload.sub;
      if (payload.name && !r.name) r.name = payload.name;
      return s;
    });

    const updated = findResident(nextStore, resident.id);
    res.json({ token: signToken(updated), resident: sanitizeResident(updated) });
  } catch (error) {
    next(error);
  }
});

// ── Admin login ───────────────────────────────────────────────────────────────

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const store = await readStore();
    const admin = store.admin;
    if (!admin || admin.email.toLowerCase() !== email.trim().toLowerCase())
      return res.status(401).json({ message: "Invalid credentials." });

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    const { passwordHash: _ph, ...safeAdmin } = admin;
    res.json({ token: signToken(admin), admin: safeAdmin });
  } catch (error) {
    next(error);
  }
});

// ── Resident protected routes ─────────────────────────────────────────────────

app.get("/api/auth/me", requireAuth, async (req, res, next) => {
  try {
    const store = await readStore();
    const resident = findResident(store, req.user.sub);
    if (!resident) return res.status(403).json({ message: "Access denied." });
    res.json({ resident: sanitizeResident(resident) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bootstrap", requireAuth, async (req, res, next) => {
  try {
    const store = await readStore();
    const resident = findResident(store, req.user.sub);
    if (!resident) return res.status(403).json({ message: "Resident not found." });
    res.json(buildBootstrapPayload(resident, store));
  } catch (error) {
    next(error);
  }
});

app.post("/api/complaints", requireAuth, async (req, res, next) => {
  try {
    const { title, category, priority, description } = req.body;
    if (!title?.trim() || !description?.trim())
      return res.status(400).json({ message: "Title and description are required." });

    const nextStore = await updateStore((store) => {
      const resident = ensureResident(store, req.user.sub);
      const { date, time } = nowParts();
      const categoryIconMap = {
        Plumbing: "plumbing",
        Electrical: "bolt",
        Carpentry: "carpenter",
        Cleaning: "cleaning_services",
        HVAC: "ac_unit",
        General: "more_horiz",
        Technical: "memory",
      };
      const complaint = {
        id: createComplaintId(),
        title: title.trim(),
        category: category || "General",
        categoryIcon: categoryIconMap[category] || "help",
        status: "Pending",
        priority: priority || "Medium",
        date,
        time,
        description: description.trim(),
        technician: null,
        unit: resident.unit,
      };
      if (!Array.isArray(resident.complaints)) resident.complaints = [];
      resident.complaints.unshift(complaint);
      pushNotification(resident, {
        icon: "report_problem",
        title: `Complaint submitted: ${complaint.title}`,
        time: "Just now",
      });
      pushHistory(resident, {
        type: "Complaint",
        icon: "report_problem",
        title: complaint.title,
        ref: `#${complaint.id}`,
        date,
        time,
        status: complaint.status,
        amount: null,
      });
      return store;
    });

    const resident = findResident(nextStore, req.user.sub);
    res.status(201).json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/complaints/:complaintId/resolve", requireAuth, async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const nextStore = await updateStore((store) => {
      const resident = ensureResident(store, req.user.sub);
      const complaint = (resident.complaints || []).find((c) => c.id === complaintId);
      if (!complaint) throw new Error("Complaint not found");
      complaint.status = "Resolved";
      const { date, time } = nowParts();
      pushNotification(resident, {
        icon: "check_circle",
        title: `Complaint ${complaint.id} marked resolved.`,
        time: "Just now",
      });
      pushHistory(resident, {
        type: "Complaint",
        icon: "report_problem",
        title: complaint.title,
        ref: `#${complaint.id}`,
        date,
        time,
        status: "Resolved",
        amount: null,
      });
      return store;
    });

    const resident = findResident(nextStore, req.user.sub);
    res.json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.post("/api/bookings", requireAuth, async (req, res, next) => {
  try {
    const { facility, date } = req.body;
    if (!facility || !date)
      return res.status(400).json({ message: "Facility and date are required." });

    const nextStore = await updateStore((store) => {
      const resident = ensureResident(store, req.user.sub);
      const bookingId = `B${Date.now()}`;
      const booking = { id: bookingId, facility, date, status: "Pending Approval" };
      if (!Array.isArray(resident.bookings)) resident.bookings = [];
      resident.bookings.unshift(booking);
      if (!Array.isArray(store.scheduleEvents)) store.scheduleEvents = [];
      store.scheduleEvents.unshift({
        id: `E${Date.now()}`,
        bookingId, // link for future cleanup
        title: `${facility} Booking Request`,
        icon: "event_available",
        color: "tertiary",
        date,
        time: "Resident requested slot",
        location: facility,
        desc: `Booking request for ${resident.unit}. Awaiting committee approval.`,
        tag: "Personal",
      });
      pushNotification(resident, {
        icon: "calendar_today",
        title: `Facility booking: ${facility} on ${date}`,
        time: "Just now",
      });
      return store;
    });

    const resident = findResident(nextStore, req.user.sub);
    res.status(201).json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.put("/api/profile", requireAuth, async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const nextStore = await updateStore((store) => {
      const resident = ensureResident(store, req.user.sub);

      // Prevent duplicate email
      if (email?.trim()) {
        const newEmail = email.trim().toLowerCase();
        const duplicate = store.residents.find(
          (r) => r.id !== resident.id && r.email.toLowerCase() === newEmail,
        );
        if (duplicate) throw new Error("Email already in use by another account.");
        resident.email = newEmail;
      }
      if (name?.trim()) resident.name = name.trim();
      if (phone?.trim()) resident.phone = phone.trim();
      return store;
    });

    const resident = findResident(nextStore, req.user.sub);
    res.json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.put("/api/preferences", requireAuth, async (req, res, next) => {
  try {
    const nextStore = await updateStore((store) => {
      const resident = ensureResident(store, req.user.sub);
      resident.preferences = { ...(resident.preferences || {}), ...req.body };
      return store;
    });

    const resident = findResident(nextStore, req.user.sub);
    res.json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.post("/api/help/chat", requireAuth, async (req, res, next) => {
  try {
    const store = await readStore();
    const message = req.body.message?.trim();
    if (!message) return res.status(400).json({ message: "Message is required." });
    res.json({ reply: buildChatReply(message, store.faqs) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/feedback", requireAuth, async (req, res, next) => {
  try {
    const { helpful } = req.body;
    const nextStore = await updateStore((store) => {
      if (!store.feedback) store.feedback = { helpful: 0, notHelpful: 0 };
      if (helpful) store.feedback.helpful += 1;
      else store.feedback.notHelpful += 1;
      return store;
    });
    res.json({ feedback: nextStore.feedback });
  } catch (error) {
    next(error);
  }
});

// ── Payment routes ────────────────────────────────────────────────────────────

app.post("/api/payments/create-order", requireAuth, async (req, res, next) => {
  try {
    const { billId } = req.body;
    if (!billId) return res.status(400).json({ message: "billId is required." });

    const store = await readStore();
    const resident = findResident(store, req.user.sub);
    if (!resident) return res.status(403).json({ message: "Resident not found." });

    const bill = (resident.bills || []).find((b) => b.id === billId);
    if (!bill) return res.status(404).json({ message: "Bill not found." });
    if (bill.status === "Paid")
      return res.status(400).json({ message: "This bill is already paid." });

    const order = await createOrder({ billId, amount: bill.amount, residentName: resident.name });
    res.json({
      order,
      paymentGateway: getGatewayConfig(),
      totals: getPaymentTotals(bill.amount),
      bill,
      resident: sanitizeResident(resident),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/demo-complete", requireAuth, async (req, res, next) => {
  try {
    const { billId, method } = req.body;
    if (!billId) return res.status(400).json({ message: "billId is required." });

    const nextStore = await markBillPaid(req.user.sub, {
      billId,
      paymentId: createTransactionId(),
      paymentMethod: method || "demo",
      paymentSource: "demo",
    });
    const resident = findResident(nextStore, req.user.sub);
    res.json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

app.post("/api/payments/verify", requireAuth, async (req, res, next) => {
  try {
    const {
      billId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (!verifySignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ message: "Payment verification failed." });
    }

    const nextStore = await markBillPaid(req.user.sub, {
      billId,
      paymentId,
      paymentMethod: "razorpay",
      paymentSource: orderId,
    });
    const resident = findResident(nextStore, req.user.sub);
    res.json(buildBootstrapPayload(resident, nextStore));
  } catch (error) {
    next(error);
  }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

app.get("/api/admin/bootstrap", requireAdmin, async (_req, res, next) => {
  try {
    const store = await readStore();
    const { passwordHash: _ph, ...safeAdmin } = store.admin;
    res.json({
      admin: safeAdmin,
      residents: store.residents.map(sanitizeResident),
      scheduleEvents: store.scheduleEvents || [],
      faqs: store.faqs || [],
      feedback: store.feedback || { helpful: 0, notHelpful: 0 },
      paymentGateway: getGatewayConfig(),
      complaints: store.residents.flatMap((r) =>
        (r.complaints || []).map((c) => ({ ...c, residentId: r.id, residentName: r.name })),
      ),
      bills: store.residents.flatMap((r) =>
        (r.bills || []).map((b) => ({ ...b, residentId: r.id, residentName: r.name, unit: r.unit })),
      ),
      bookings: store.residents.flatMap((r) =>
        (r.bookings || []).map((b) => ({
          ...b,
          residentId: r.id,
          residentName: r.name,
          unit: r.unit,
        })),
      ),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/residents", requireAdmin, async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json({ residents: store.residents.map(sanitizeResident) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/residents/:residentId/status", requireAdmin, async (req, res, next) => {
  try {
    const { residentId } = req.params;
    const { status } = req.body;
    if (!["active", "pending", "suspended"].includes(status)) {
      return res.status(400).json({ message: "status must be active, pending, or suspended." });
    }

    const nextStore = await updateStore((store) => {
      const resident = findResident(store, residentId);
      if (!resident) throw new Error("Resident not found");
      resident.status = status;
      if (status === "active") {
        pushNotification(resident, {
          icon: "check_circle",
          title: "Your account has been approved! Welcome to SocietyConnect.",
          time: "Just now",
        });
      }
      return store;
    });

    res.json({ residents: nextStore.residents.map(sanitizeResident) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/residents/:residentId", requireAdmin, async (req, res, next) => {
  try {
    const { residentId } = req.params;
    if (residentId === "res-1") {
      return res.status(400).json({ message: "Cannot delete the demo resident." });
    }

    const nextStore = await updateStore((store) => {
      const idx = store.residents.findIndex((r) => r.id === residentId);
      if (idx === -1) throw new Error("Resident not found");
      store.residents.splice(idx, 1);
      return store;
    });
    res.json({ residents: nextStore.residents.map(sanitizeResident) });
  } catch (error) {
    next(error);
  }
});

// Add bill to a specific resident
app.post("/api/admin/residents/:residentId/bills", requireAdmin, async (req, res, next) => {
  try {
    const { residentId } = req.params;
    const { type, amount, dueDate, period, breakdown } = req.body;
    if (!type || !amount || !dueDate || !period) {
      return res
        .status(400)
        .json({ message: "type, amount, dueDate and period are required." });
    }

    const nextStore = await updateStore((store) => {
      const resident = findResident(store, residentId);
      if (!resident) throw new Error("Resident not found");
      if (!Array.isArray(resident.bills)) resident.bills = [];
      const bill = {
        id: `INV-${Date.now()}`,
        type,
        amount: Number(amount),
        dueDate,
        period,
        status: "Unpaid",
        breakdown: breakdown || [{ label: type, amt: Number(amount) }],
        lastTransaction: null,
      };
      resident.bills.unshift(bill);
      pushNotification(resident, {
        icon: "payments",
        title: `New bill: ${type} — ${period}`,
        time: "Just now",
      });
      return store;
    });

    res.status(201).json({ bills: findResident(nextStore, residentId).bills });
  } catch (error) {
    next(error);
  }
});

// Delete a bill from a specific resident
app.delete(
  "/api/admin/residents/:residentId/bills/:billId",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { residentId, billId } = req.params;
      const nextStore = await updateStore((store) => {
        const resident = findResident(store, residentId);
        if (!resident) throw new Error("Resident not found");
        const idx = (resident.bills || []).findIndex((b) => b.id === billId);
        if (idx === -1) throw new Error("Bill not found");
        resident.bills.splice(idx, 1);
        return store;
      });
      res.json({ bills: findResident(nextStore, residentId).bills });
    } catch (error) {
      next(error);
    }
  },
);

// Admin global billing overview — these route to the first resident that owns the bill
// POST /api/admin/bills — creates a global bill (broadcasts to all active residents)
app.post("/api/admin/bills", requireAdmin, async (req, res, next) => {
  try {
    const { type, amount, dueDate, period, breakdown } = req.body;
    if (!type || !amount || !dueDate || !period) {
      return res
        .status(400)
        .json({ message: "type, amount, dueDate and period are required." });
    }

    const nextStore = await updateStore((store) => {
      const active = store.residents.filter((r) => r.status === "active");
      if (active.length === 0) throw new Error("No active residents found.");
      for (const resident of active) {
        if (!Array.isArray(resident.bills)) resident.bills = [];
        const bill = {
          id: `INV-${Date.now()}-${resident.id}`,
          type,
          amount: Number(amount),
          dueDate,
          period,
          status: "Unpaid",
          breakdown: breakdown || [{ label: type, amt: Number(amount) }],
          lastTransaction: null,
        };
        resident.bills.unshift(bill);
        pushNotification(resident, {
          icon: "payments",
          title: `New bill: ${type} — ${period}`,
          time: "Just now",
        });
      }
      return store;
    });

    const bills = nextStore.residents.flatMap((r) =>
      (r.bills || []).map((b) => ({
        ...b,
        residentId: r.id,
        residentName: r.name,
        unit: r.unit,
      })),
    );
    res.status(201).json({ bills });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/bills/:billId — finds and deletes the bill from whichever resident owns it
app.delete("/api/admin/bills/:billId", requireAdmin, async (req, res, next) => {
  try {
    const { billId } = req.params;
    const nextStore = await updateStore((store) => {
      for (const resident of store.residents) {
        const idx = (resident.bills || []).findIndex((b) => b.id === billId);
        if (idx !== -1) {
          resident.bills.splice(idx, 1);
          return store;
        }
      }
      throw new Error("Bill not found");
    });

    const bills = nextStore.residents.flatMap((r) =>
      (r.bills || []).map((b) => ({
        ...b,
        residentId: r.id,
        residentName: r.name,
        unit: r.unit,
      })),
    );
    res.json({ bills });
  } catch (error) {
    next(error);
  }
});

// Assign technician / update complaint status
app.patch(
  "/api/admin/complaints/:complaintId/assign",
  requireAdmin,
  async (req, res, next) => {
    try {
      const { complaintId } = req.params;
      const { technician, status } = req.body;

      const nextStore = await updateStore((store) => {
        for (const resident of store.residents) {
          const complaint = (resident.complaints || []).find(
            (c) => c.id === complaintId,
          );
          if (complaint) {
            if (technician !== undefined) complaint.technician = technician;
            if (status) complaint.status = status;
            if (status === "Resolved") {
              pushNotification(resident, {
                icon: "check_circle",
                title: `Your complaint ${complaint.id} has been resolved.`,
                time: "Just now",
              });
            } else if (status === "Assigned" && technician) {
              pushNotification(resident, {
                icon: "engineering",
                title: `${technician} assigned to your complaint: ${complaint.title}`,
                time: "Just now",
              });
            }
            return store;
          }
        }
        throw new Error("Complaint not found");
      });

      const complaints = nextStore.residents.flatMap((r) =>
        (r.complaints || []).map((c) => ({
          ...c,
          residentId: r.id,
          residentName: r.name,
        })),
      );
      res.json({ complaints });
    } catch (error) {
      next(error);
    }
  },
);

// Approve / reject booking
app.patch("/api/admin/bookings/:bookingId", requireAdmin, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be Approved or Rejected." });
    }

    const nextStore = await updateStore((store) => {
      for (const resident of store.residents) {
        const booking = (resident.bookings || []).find((b) => b.id === bookingId);
        if (booking) {
          booking.status = status;
          pushNotification(resident, {
            icon: status === "Approved" ? "event_available" : "event_busy",
            title: `Your booking for ${booking.facility} has been ${status.toLowerCase()}.`,
            time: "Just now",
          });
          return store;
        }
      }
      throw new Error("Booking not found");
    });

    const bookings = nextStore.residents.flatMap((r) =>
      (r.bookings || []).map((b) => ({
        ...b,
        residentId: r.id,
        residentName: r.name,
        unit: r.unit,
      })),
    );
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

// Schedule events
app.post("/api/admin/schedule", requireAdmin, async (req, res, next) => {
  try {
    const { title, date, time, location, desc, tag, icon, color } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "title and date are required." });
    }

    const nextStore = await updateStore((store) => {
      if (!Array.isArray(store.scheduleEvents)) store.scheduleEvents = [];
      store.scheduleEvents.unshift({
        id: `E${Date.now()}`,
        title,
        icon: icon || "event",
        color: color || "primary",
        date,
        time: time || "TBD",
        location: location || "Society Premises",
        desc: desc || "",
        tag: tag || "Building",
      });
      return store;
    });
    res.status(201).json({ scheduleEvents: nextStore.scheduleEvents });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/schedule/:eventId", requireAdmin, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const nextStore = await updateStore((store) => {
      const idx = (store.scheduleEvents || []).findIndex((e) => e.id === eventId);
      if (idx === -1) throw new Error("Event not found");
      store.scheduleEvents.splice(idx, 1);
      return store;
    });
    res.json({ scheduleEvents: nextStore.scheduleEvents });
  } catch (error) {
    next(error);
  }
});

// FAQs
app.post("/api/admin/faqs", requireAdmin, async (req, res, next) => {
  try {
    const { q, a } = req.body;
    if (!q?.trim() || !a?.trim()) {
      return res.status(400).json({ message: "Question and answer are required." });
    }
    const nextStore = await updateStore((store) => {
      if (!Array.isArray(store.faqs)) store.faqs = [];
      store.faqs.push({ q: q.trim(), a: a.trim() });
      return store;
    });
    res.status(201).json({ faqs: nextStore.faqs });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/faqs/:index", requireAdmin, async (req, res, next) => {
  try {
    const idx = Number(req.params.index);
    const nextStore = await updateStore((store) => {
      if (!Array.isArray(store.faqs) || idx < 0 || idx >= store.faqs.length) {
        throw new Error("FAQ not found");
      }
      store.faqs.splice(idx, 1);
      return store;
    });
    res.json({ faqs: nextStore.faqs });
  } catch (error) {
    next(error);
  }
});

// Broadcast notification to all active residents (or a specific one)
app.post("/api/admin/notify", requireAdmin, async (req, res, next) => {
  try {
    const { title, icon, residentId } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: "title is required." });

    await updateStore((store) => {
      const targets = residentId
        ? store.residents.filter((r) => r.id === residentId)
        : store.residents.filter((r) => r.status === "active");
      for (const r of targets) {
        pushNotification(r, {
          icon: icon || "campaign",
          title: title.trim(),
          time: "Just now",
        });
      }
      return store;
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((error, _req, res, _next) => {
  console.error("[server error]", error);
  const message = error.message || "Internal server error";
  let status = 500;
  if (message.toLowerCase().includes("not found")) status = 404;
  else if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("already in use")) status = 409;
  res.status(status).json({ message });
});

// ── Static (production) ───────────────────────────────────────────────────────

app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (req.path.startsWith("/admin")) {
    return res.sendFile(path.join(distDir, "admin.html"), (err) => {
      if (err) next();
    });
  }
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(port, () =>
  console.log(`SocietyConnect backend running on http://localhost:${port}`),
);

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  console.log("KEY ID:", JSON.stringify(keyId));
  console.log("SECRET length:", keySecret?.length, "starts:", keySecret?.slice(0,4));
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

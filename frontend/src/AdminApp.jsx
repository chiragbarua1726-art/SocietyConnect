import { useEffect, useRef, useState } from "react";
import { adminApi } from "./adminApi.js";

// ── Shared helpers ───────────────────────────────────────────────────────────

function Icon({ name, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24", ...style }}
    >
      {name}
    </span>
  );
}

function Badge({ label, color = "#c7bfff", bg = "rgba(199,191,255,0.1)" }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 99,
        background: bg,
        color,
        border: `1px solid ${color}40`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.type === "success" ? "#1d1f26" : t.type === "error" ? "#871f21" : "#17191f",
            border: `1px solid ${t.type === "success" ? "#c7bfff" : t.type === "error" ? "#fa746f" : "#454850"}`,
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "#e4e5f0",
            minWidth: 260,
            maxWidth: 360,
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}
        >
          <Icon
            name={t.type === "success" ? "check_circle" : t.type === "error" ? "error" : "info"}
            style={{ color: t.type === "success" ? "#c7bfff" : t.type === "error" ? "#fa746f" : "#bbc6e8" }}
          />
          <span style={{ fontSize: 14, flex: 1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}>
            <Icon name="close" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#17191f", border: "1px solid #454850", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "#c7bfff", sub }) {
  return (
    <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
        <Icon name={icon} style={{ color, fontSize: 20 }} />
      </div>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#73757f" }}>{sub}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "#111318",
  border: "1px solid #454850",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#e4e5f0",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#a9aab5",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const btnPrimary = {
  background: "#c7bfff",
  color: "#3d3092",
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const btnSecondary = {
  background: "transparent",
  color: "#e4e5f0",
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #454850",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const btnDanger = {
  background: "rgba(135,31,33,0.3)",
  color: "#ff9993",
  padding: "7px 12px",
  borderRadius: 8,
  border: "1px solid rgba(250,116,111,0.25)",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
};

// ── Priority / status color maps ─────────────────────────────────────────────

const priorityColor = { Urgent: "#fa746f", Medium: "#c7bfff", Low: "#73757f" };
const priorityBg = { Urgent: "rgba(135,31,33,0.3)", Medium: "rgba(199,191,255,0.1)", Low: "#23262e" };
const statusColor = { Pending: "#ead4ff", Assigned: "#bbc6e8", "In Progress": "#c7bfff", Resolved: "#73757f" };
const statusBg = { Pending: "rgba(234,212,255,0.1)", Assigned: "rgba(187,198,232,0.1)", "In Progress": "rgba(199,191,255,0.1)", Resolved: "#23262e" };

// ── Pages ────────────────────────────────────────────────────────────────────

function OverviewPage({ data, setActivePage }) {
  const complaints = data.complaints;
  const bills = data.bills;
  const bookings = data.bookings;
  const residents = data.residents || [];

  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => c.status === "Pending").length;
  const resolvedComplaints = complaints.filter((c) => c.status === "Resolved").length;
  const unpaidBills = bills.filter((b) => b.status === "Unpaid");
  const totalRevenue = bills.filter((b) => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);
  const pendingBookings = bookings.filter((b) => b.status === "Pending Approval").length;
  const pendingResidents = residents.filter((r) => r.status === "pending").length;

  // Flatten history from all residents for recent activity
  const recentActivity = residents
    .flatMap((r) => (r.history || []).map((h) => ({ ...h, residentName: r.name })))
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 6);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#c7bfff" }}>Society Overview</h2>
        <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Live snapshot of the society's current state.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Residents" value={residents.length} icon="group" color="#c7bfff" sub={pendingResidents > 0 ? `${pendingResidents} pending approval` : "All active"} />
        <StatCard label="Total Complaints" value={totalComplaints} icon="report_problem" color="#fa746f" sub={`${pendingComplaints} pending`} />
        <StatCard label="Unpaid Bills" value={unpaidBills.length} icon="receipt_long" color="#ead4ff" sub={unpaidBills.length > 0 ? `Due: ${unpaidBills[0].dueDate}` : "All clear"} />
        <StatCard label="Revenue Collected" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon="payments" color="#bbc6e8" sub="Paid bills total" />
        <StatCard label="Pending Bookings" value={pendingBookings} icon="event_available" color="#ead4ff" sub="Awaiting approval" />
        <StatCard label="Help Feedback" value={data.feedback?.helpful ?? 0} icon="thumb_up" color="#4ade80" sub={`${data.feedback?.notHelpful ?? 0} not helpful`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", color: "#e4e5f0", fontSize: 16, fontWeight: 600 }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentActivity.length === 0 && (
              <p style={{ margin: 0, fontSize: 13, color: "#73757f" }}>No recent activity.</p>
            )}
            {recentActivity.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#111318", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                <Icon name={item.icon} style={{ color: item.type === "Payment" ? "#c7bfff" : item.type === "Complaint" ? "#fa746f" : "#ead4ff", fontSize: 20 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#e4e5f0", fontWeight: 600 }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>{item.residentName} · {item.date}</p>
                </div>
                <span style={{ fontSize: 11, color: "#a9aab5" }}>{item.amount || item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", color: "#e4e5f0", fontSize: 16, fontWeight: 600 }}>Complaints by Category</h3>
            {["Plumbing", "Electrical", "Carpentry", "Cleaning", "HVAC", "General", "Technical"].map((cat) => {
              const count = complaints.filter((c) => c.category === cat).length;
              if (count === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: "#a9aab5" }}>{cat}</span>
                    <span style={{ fontSize: 12, color: "#c7bfff", fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: "#23262e", borderRadius: 99 }}>
                    <div style={{ height: 4, width: `${totalComplaints > 0 ? (count / totalComplaints) * 100 : 0}%`, background: "#c7bfff", borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#4f44a5", border: "1px solid rgba(199,191,255,0.2)", borderRadius: 14, padding: 20 }}>
            <h4 style={{ margin: "0 0 10px", color: "rgba(229,223,255,0.9)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Residents Summary</h4>
            {residents.slice(0, 3).map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="person" style={{ color: "rgba(229,223,255,0.8)", fontSize: 17 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(229,223,255,0.6)" }}>{r.unit}</p>
                </div>
              </div>
            ))}
            {residents.length > 3 && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(229,223,255,0.6)" }}>+{residents.length - 3} more residents</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplaintsPage({ complaints, onAssign, addToast }) {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ technician: "", status: "" });
  const [saving, setSaving] = useState(false);

  const filtered =
    filter === "ALL"
      ? complaints
      : filter === "PENDING"
        ? complaints.filter((c) => c.status === "Pending")
        : filter === "ASSIGNED"
          ? complaints.filter((c) => c.status === "Assigned" || c.status === "In Progress")
          : complaints.filter((c) => c.status === "Resolved");

  const openAssign = (complaint) => {
    setSelected(complaint);
    setForm({ technician: complaint.technician || "", status: complaint.status });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onAssign(selected.id, form);
      addToast("Complaint updated.", "success");
      setSelected(null);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>All Complaints</h2>
        <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Assign technicians and update complaint status.</p>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#111318", borderRadius: 10, padding: 4, marginBottom: 16, border: "1px solid rgba(69,72,80,0.4)", width: "fit-content" }}>
        {["ALL", "PENDING", "ASSIGNED", "RESOLVED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: filter === f ? "#303b57" : "transparent", color: filter === f ? "#b4bfe1" : "#a9aab5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => (
          <div
            key={c.id}
            style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `4px solid ${priorityColor[c.priority] || "#454850"}`, borderRadius: 12, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, background: priorityBg[c.priority] || "#23262e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={c.categoryIcon} style={{ color: priorityColor[c.priority] || "#a9aab5" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e4e5f0" }}>{c.title}</h4>
                  <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>#{c.id} · {c.unit} · {c.date}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Badge label={c.priority} color={priorityColor[c.priority]} bg={priorityBg[c.priority]} />
                  <Badge label={c.status} color={statusColor[c.status] || "#a9aab5"} bg={statusBg[c.status] || "#23262e"} />
                </div>
              </div>
              <p style={{ margin: "4px 0 8px", fontSize: 13, color: "#a9aab5" }}>{c.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(69,72,80,0.3)", paddingTop: 8 }}>
                <span style={{ fontSize: 12, color: c.technician ? "#bbc6e8" : "#73757f" }}>
                  {c.technician ? `👷 ${c.technician}` : "Unassigned"}
                </span>
                <button onClick={() => openAssign(c)} style={btnSecondary}>
                  <Icon name="edit" style={{ fontSize: 16 }} />
                  {c.status === "Resolved" ? "View" : "Manage"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ textAlign: "center", color: "#73757f", padding: 40 }}>No complaints found.</p>}
      </div>

      {selected && (
        <Modal title={`Manage — ${selected.title}`} onClose={() => setSelected(null)}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Technician Name</label>
            <input value={form.technician} onChange={(e) => setForm((f) => ({ ...f, technician: e.target.value }))} placeholder="e.g. Ravi Kumar" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option>Pending</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={btnPrimary}>
              <Icon name={saving ? "sync" : "save"} style={{ animation: saving ? "spin 1s linear infinite" : "none" }} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => setSelected(null)} style={btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BillingPage({ bills, onAddBill, onDeleteBill, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "Monthly Maintenance", amount: "", dueDate: "", period: "" });
  const [saving, setSaving] = useState(false);

  const formatCurrency = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const handleAdd = async () => {
    if (!form.amount || !form.dueDate || !form.period) {
      addToast("Please fill all fields.", "error");
      return;
    }
    setSaving(true);
    try {
      await onAddBill(form);
      setForm({ type: "Monthly Maintenance", amount: "", dueDate: "", period: "" });
      setShowForm(false);
      addToast("Bill created.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bill?")) return;
    try {
      await onDeleteBill(id);
      addToast("Bill deleted.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const paid = bills.filter((b) => b.status === "Paid");
  const unpaid = bills.filter((b) => b.status === "Unpaid");

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Billing</h2>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>
            {paid.length} paid · {unpaid.length} unpaid
          </p>
        </div>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>
          <Icon name="add" style={{ color: "#3d3092" }} />
          Add Bill
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {bills.map((bill) => (
          <div key={bill.id} style={{ background: "rgba(23,25,31,0.8)", border: `1px solid ${bill.status === "Unpaid" ? "rgba(250,116,111,0.15)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: bill.status === "Unpaid" ? "rgba(135,31,33,0.3)" : "rgba(48,59,87,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="receipt_long" style={{ color: bill.status === "Unpaid" ? "#ff9993" : "#b4bfe1" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e4e5f0" }}>{bill.type} — {bill.period}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{bill.id} · Due {bill.dueDate}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: bill.status === "Unpaid" ? "#fa746f" : "#c7bfff" }}>{formatCurrency(bill.amount)}</p>
                    <Badge
                      label={bill.status}
                      color={bill.status === "Unpaid" ? "#fa746f" : "#bbc6e8"}
                      bg={bill.status === "Unpaid" ? "rgba(250,116,111,0.1)" : "rgba(187,198,232,0.1)"}
                    />
                  </div>
                  <button onClick={() => handleDelete(bill.id)} style={btnDanger} title="Delete bill">
                    <Icon name="delete" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
              {bill.lastTransaction && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#4ade80" }}>
                  ✓ Paid {bill.lastTransaction.paidAt} · {bill.lastTransaction.paymentId}
                </p>
              )}
            </div>
          </div>
        ))}
        {bills.length === 0 && <p style={{ textAlign: "center", color: "#73757f", padding: 40 }}>No bills found.</p>}
      </div>

      {showForm && (
        <Modal title="Add New Bill" onClose={() => setShowForm(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Bill Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={inputStyle}>
              <option>Monthly Maintenance</option>
              <option>Water Charges</option>
              <option>Special Levy</option>
              <option>Clubhouse Booking Fee</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="5000" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Period</label>
              <input value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} placeholder="Jul 2026" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} disabled={saving} style={btnPrimary}>
              <Icon name={saving ? "sync" : "add"} style={{ animation: saving ? "spin 1s linear infinite" : "none", color: "#3d3092" }} />
              {saving ? "Saving…" : "Create Bill"}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BookingsPage({ bookings, onUpdateBooking, addToast }) {
  const [saving, setSaving] = useState(null);

  const handle = async (bookingId, status) => {
    setSaving(bookingId);
    try {
      await onUpdateBooking(bookingId, { status });
      addToast(`Booking ${status.toLowerCase()}.`, "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  const pending = bookings.filter((b) => b.status === "Pending Approval");
  const decided = bookings.filter((b) => b.status !== "Pending Approval");

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Facility Bookings</h2>
        <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Approve or reject resident booking requests.</p>
      </div>

      {pending.length > 0 && (
        <>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "#ead4ff", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
            Awaiting Approval ({pending.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {pending.map((b) => (
              <div key={b.id} style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(199,191,255,0.15)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(199,191,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="event_available" style={{ color: "#c7bfff" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e4e5f0" }}>{b.facility}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a9aab5" }}>{b.id} · {b.date}</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handle(b.id, "Approved")}
                    disabled={saving === b.id}
                    style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13 }}
                  >
                    <Icon name="check" style={{ color: "#3d3092", fontSize: 18 }} />
                    Approve
                  </button>
                  <button
                    onClick={() => handle(b.id, "Rejected")}
                    disabled={saving === b.id}
                    style={btnDanger}
                  >
                    <Icon name="close" style={{ fontSize: 16 }} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {decided.length > 0 && (
        <>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "#a9aab5", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
            Past Decisions ({decided.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {decided.map((b) => (
              <div key={b.id} style={{ background: "rgba(23,25,31,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "#e4e5f0", fontWeight: 600 }}>{b.facility}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{b.id} · {b.date}</p>
                </div>
                <Badge
                  label={b.status}
                  color={b.status === "Approved" ? "#4ade80" : "#fa746f"}
                  bg={b.status === "Approved" ? "rgba(74,222,128,0.1)" : "rgba(250,116,111,0.1)"}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {bookings.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "#73757f" }}>
          <Icon name="event_available" style={{ fontSize: 40, display: "block", marginBottom: 12 }} />
          No booking requests yet.
        </div>
      )}
    </div>
  );
}

function SchedulePage({ events, onAddEvent, onDeleteEvent, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", desc: "", tag: "Building", icon: "event", color: "primary" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title || !form.date) {
      addToast("Title and date are required.", "error");
      return;
    }
    setSaving(true);
    try {
      await onAddEvent(form);
      setForm({ title: "", date: "", time: "", location: "", desc: "", tag: "Building", icon: "event", color: "primary" });
      setShowForm(false);
      addToast("Event added.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await onDeleteEvent(id);
      addToast("Event removed.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const colorMap = { primary: "#c7bfff", secondary: "#bbc6e8", tertiary: "#ead4ff", error: "#fa746f" };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Schedule</h2>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Manage maintenance and community events.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>
          <Icon name="add" style={{ color: "#3d3092" }} />
          Add Event
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((ev) => (
          <div key={ev.id} style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${colorMap[ev.color]}18`, border: `1px solid ${colorMap[ev.color]}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={ev.icon} style={{ color: colorMap[ev.color] }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colorMap[ev.color] }}>{ev.title}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{ev.date} · {ev.time} · {ev.location}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <Badge label={ev.tag} color={colorMap[ev.color]} bg={`${colorMap[ev.color]}15`} />
                  <button onClick={() => handleDelete(ev.id)} style={btnDanger}>
                    <Icon name="delete" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#a9aab5" }}>{ev.desc}</p>
            </div>
          </div>
        ))}
        {events.length === 0 && <p style={{ textAlign: "center", color: "#73757f", padding: 40 }}>No events scheduled.</p>}
      </div>

      {showForm && (
        <Modal title="Add Schedule Event" onClose={() => setShowForm(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Lift Maintenance – Block A" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="09:00 AM – 12:00 PM" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Location</label>
            <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Community Hall" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description</label>
            <textarea rows={3} value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} placeholder="Details about this event…" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Tag</label>
              <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} style={inputStyle}>
                <option>Building</option>
                <option>Community</option>
                <option>Personal</option>
                <option>Emergency</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <select value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} style={inputStyle}>
                <option value="primary">Purple</option>
                <option value="secondary">Blue</option>
                <option value="tertiary">Lavender</option>
                <option value="error">Red</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} disabled={saving} style={btnPrimary}>
              <Icon name={saving ? "sync" : "event"} style={{ animation: saving ? "spin 1s linear infinite" : "none", color: "#3d3092" }} />
              {saving ? "Saving…" : "Add Event"}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FaqsPage({ faqs, onAddFaq, onDeleteFaq, addToast }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ q: "", a: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.q.trim() || !form.a.trim()) {
      addToast("Question and answer are required.", "error");
      return;
    }
    setSaving(true);
    try {
      await onAddFaq(form);
      setForm({ q: "", a: "" });
      setShowForm(false);
      addToast("FAQ added.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await onDeleteFaq(idx);
      addToast("FAQ removed.", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>FAQs</h2>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Manage the Help Center FAQ list.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>
          <Icon name="add" style={{ color: "#3d3092" }} />
          Add FAQ
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e4e5f0", flex: 1 }}>{faq.q}</p>
              <button onClick={() => handleDelete(idx)} style={btnDanger}>
                <Icon name="delete" style={{ fontSize: 16 }} />
              </button>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a9aab5", lineHeight: 1.6 }}>{faq.a}</p>
          </div>
        ))}
        {faqs.length === 0 && <p style={{ textAlign: "center", color: "#73757f", padding: 40 }}>No FAQs yet.</p>}
      </div>

      {showForm && (
        <Modal title="Add FAQ" onClose={() => setShowForm(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Question *</label>
            <input value={form.q} onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))} placeholder="What is the maintenance due date?" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Answer *</label>
            <textarea rows={4} value={form.a} onChange={(e) => setForm((f) => ({ ...f, a: e.target.value }))} placeholder="Write the answer here…" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleAdd} disabled={saving} style={btnPrimary}>
              <Icon name={saving ? "sync" : "save"} style={{ animation: saving ? "spin 1s linear infinite" : "none", color: "#3d3092" }} />
              {saving ? "Saving…" : "Save FAQ"}
            </button>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ResidentsPage({ residents, onUpdateStatus, onDeleteResident, onAddBill, addToast }) {
  const [selected, setSelected] = useState(null);
  const [billForm, setBillForm] = useState({ type: "Monthly Maintenance", amount: "", dueDate: "", period: "" });
  const [showBillForm, setShowBillForm] = useState(false);
  const [saving, setSaving] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? residents : residents.filter((r) => r.status === filter);

  const statusColor = { active: "#4ade80", pending: "#ead4ff", suspended: "#fa746f" };
  const statusBg = { active: "rgba(74,222,128,0.1)", pending: "rgba(234,212,255,0.1)", suspended: "rgba(250,116,111,0.1)" };

  const handleStatus = async (id, status) => {
    setSaving(id + status);
    try {
      await onUpdateStatus(id, { status });
      addToast(`Resident ${status}.`, "success");
    } catch (e) { addToast(e.message, "error"); }
    finally { setSaving(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this resident and all their data?")) return;
    try {
      await onDeleteResident(id);
      if (selected?.id === id) setSelected(null);
      addToast("Resident removed.", "success");
    } catch (e) { addToast(e.message, "error"); }
  };

  const handleAddBill = async () => {
    if (!billForm.amount || !billForm.dueDate || !billForm.period) {
      addToast("Fill all bill fields.", "error"); return;
    }
    setSaving("bill");
    try {
      await onAddBill(selected.id, billForm);
      setBillForm({ type: "Monthly Maintenance", amount: "", dueDate: "", period: "" });
      setShowBillForm(false);
      addToast("Bill added.", "success");
    } catch (e) { addToast(e.message, "error"); }
    finally { setSaving(null); }
  };

  const pendingCount = residents.filter((r) => r.status === "pending").length;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Residents</h2>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>
            {residents.length} total · {pendingCount > 0 && <span style={{ color: "#ead4ff", fontWeight: 700 }}>{pendingCount} pending approval</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#111318", borderRadius: 10, padding: 4, border: "1px solid rgba(69,72,80,0.4)" }}>
          {["all", "active", "pending", "suspended"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: filter === f ? "#303b57" : "transparent", color: filter === f ? "#b4bfe1" : "#a9aab5", fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelected(selected?.id === r.id ? null : r)}
              style={{ background: selected?.id === r.id ? "rgba(199,191,255,0.07)" : "rgba(23,25,31,0.8)", border: `1px solid ${selected?.id === r.id ? "rgba(199,191,255,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#303b57", border: "2px solid rgba(199,191,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="person" style={{ color: "#c7bfff", fontSize: 24 }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e4e5f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</h4>
                  <Badge label={r.status} color={statusColor[r.status] || "#a9aab5"} bg={statusBg[r.status] || "#23262e"} />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#73757f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.unit} · {r.email}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {r.status === "pending" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatus(r.id, "active"); }}
                    disabled={saving === r.id + "active"}
                    style={{ ...btnPrimary, padding: "7px 12px", fontSize: 12 }}
                  >
                    <Icon name="check" style={{ color: "#3d3092", fontSize: 16 }} />
                    Approve
                  </button>
                )}
                {r.status === "active" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatus(r.id, "suspended"); }}
                    disabled={saving === r.id + "suspended"}
                    style={btnDanger}
                  >
                    <Icon name="block" style={{ fontSize: 16 }} />
                    Suspend
                  </button>
                )}
                {r.status === "suspended" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatus(r.id, "active"); }}
                    disabled={saving === r.id + "active"}
                    style={{ ...btnSecondary, fontSize: 12 }}
                  >
                    <Icon name="lock_open" style={{ fontSize: 16 }} />
                    Reactivate
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} style={btnDanger} title="Delete resident">
                  <Icon name="delete" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#73757f" }}>
              <Icon name="group_off" style={{ fontSize: 40, display: "block", margin: "0 auto 12px" }} />
              No residents found.
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, position: "sticky", top: 80 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 16, fontWeight: 700 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}>
                <Icon name="close" />
              </button>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {[
                { icon: "apartment", label: selected.unit },
                { icon: "email", label: selected.email },
                { icon: "phone", label: selected.phone || "—" },
                { icon: "calendar_today", label: `Joined ${selected.joinedAt || "—"}` },
              ].map((item) => (
                <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={item.icon} style={{ color: "#a9aab5", fontSize: 17 }} />
                  <span style={{ fontSize: 13, color: "#e4e5f0" }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
              {[
                { label: "Complaints", value: selected.complaints?.length ?? 0, color: "#fa746f" },
                { label: "Bills", value: selected.bills?.length ?? 0, color: "#c7bfff" },
                { label: "Bookings", value: selected.bookings?.length ?? 0, color: "#bbc6e8" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#111318", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "#73757f", textTransform: "uppercase", fontWeight: 700 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bills section */}
            <div style={{ borderTop: "1px solid rgba(69,72,80,0.3)", paddingTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.08em" }}>Bills</span>
                <button onClick={() => setShowBillForm((v) => !v)} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 12 }}>
                  <Icon name={showBillForm ? "close" : "add"} style={{ fontSize: 16 }} />
                  {showBillForm ? "Cancel" : "Add Bill"}
                </button>
              </div>

              {showBillForm && (
                <div style={{ background: "#111318", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Type</label>
                    <select value={billForm.type} onChange={(e) => setBillForm((f) => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px" }}>
                      <option>Monthly Maintenance</option>
                      <option>Water Charges</option>
                      <option>Special Levy</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: 4 }}>Amount (₹)</label>
                      <input type="number" value={billForm.amount} onChange={(e) => setBillForm((f) => ({ ...f, amount: e.target.value }))} placeholder="5000" style={{ ...inputStyle, padding: "8px 10px" }} />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, marginBottom: 4 }}>Period</label>
                      <input value={billForm.period} onChange={(e) => setBillForm((f) => ({ ...f, period: e.target.value }))} placeholder="Jul 2026" style={{ ...inputStyle, padding: "8px 10px" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Due Date</label>
                    <input type="date" value={billForm.dueDate} onChange={(e) => setBillForm((f) => ({ ...f, dueDate: e.target.value }))} style={{ ...inputStyle, padding: "8px 10px" }} />
                  </div>
                  <button onClick={handleAddBill} disabled={saving === "bill"} style={{ ...btnPrimary, width: "100%", justifyContent: "center", padding: "9px" }}>
                    <Icon name={saving === "bill" ? "sync" : "add"} style={{ color: "#3d3092", fontSize: 17, animation: saving === "bill" ? "spin 1s linear infinite" : "none" }} />
                    {saving === "bill" ? "Saving…" : "Add Bill"}
                  </button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {(selected.bills || []).map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#111318", borderRadius: 8, gap: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: "#e4e5f0", fontWeight: 600 }}>{b.type}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>{b.period} · ₹{b.amount.toLocaleString("en-IN")}</p>
                    </div>
                    <Badge label={b.status} color={b.status === "Paid" ? "#4ade80" : "#fa746f"} bg={b.status === "Paid" ? "rgba(74,222,128,0.1)" : "rgba(250,116,111,0.1)"} />
                  </div>
                ))}
                {(selected.bills || []).length === 0 && <p style={{ margin: 0, fontSize: 12, color: "#73757f" }}>No bills yet.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsPage({ notifications, onSend, addToast }) {
  const [form, setForm] = useState({ title: "", icon: "campaign" });
  const [sending, setSending] = useState(false);

  const handle = async () => {
    if (!form.title.trim()) {
      addToast("Message is required.", "error");
      return;
    }
    setSending(true);
    try {
      await onSend(form);
      setForm({ title: "", icon: "campaign" });
      addToast("Notification sent to resident.", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Notifications</h2>
        <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Broadcast a message to the resident's notification panel.</p>
      </div>

      <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", color: "#e4e5f0", fontSize: 16, fontWeight: 600 }}>Send Broadcast</h3>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Icon</label>
          <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={inputStyle}>
            <option value="campaign">📢 Announcement</option>
            <option value="payments">💳 Payments</option>
            <option value="report_problem">⚠️ Complaint</option>
            <option value="event">📅 Event</option>
            <option value="info">ℹ️ Info</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Message *</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Water supply will be interrupted tomorrow 10AM–1PM." style={inputStyle} />
        </div>
        <button onClick={handle} disabled={sending} style={btnPrimary}>
          <Icon name={sending ? "sync" : "send"} style={{ animation: sending ? "spin 1s linear infinite" : "none", color: "#3d3092" }} />
          {sending ? "Sending…" : "Send Notification"}
        </button>
      </div>

      <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: "#111318", borderBottom: "1px solid #454850" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e5f0" }}>Recent Notifications ({notifications.length})</span>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(69,72,80,0.3)", display: "flex", gap: 12, background: n.read ? "transparent" : "rgba(199,191,255,0.03)" }}>
              <Icon name={n.icon} style={{ color: n.read ? "#a9aab5" : "#c7bfff", marginTop: 2 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, color: n.read ? "#a9aab5" : "#e4e5f0", fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{n.time}</p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fa746f", marginLeft: "auto", marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
          {notifications.length === 0 && <p style={{ padding: 24, textAlign: "center", color: "#73757f" }}>No notifications yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function AdminSidebar({ active, setActive, admin, onLogout }) {
  const navItems = [
    { id: "overview", icon: "dashboard", label: "Overview" },
    { id: "residents", icon: "group", label: "Residents" },
    { id: "complaints", icon: "report_problem", label: "Complaints" },
    { id: "billing", icon: "payments", label: "Billing" },
    { id: "bookings", icon: "event_available", label: "Bookings" },
    { id: "schedule", icon: "calendar_today", label: "Schedule" },
    { id: "faqs", icon: "help", label: "FAQs" },
    { id: "notifications", icon: "campaign", label: "Notifications" },
  ];

  return (
    <aside style={{ width: 240, background: "rgba(13,14,18,0.98)", borderRight: "1px solid #2a2d35", display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, padding: "28px 0 0" }}>
      <div style={{ padding: "0 16px 24px", borderBottom: "1px solid rgba(69,72,80,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(199,191,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="admin_panel_settings" style={{ color: "#c7bfff", fontSize: 22 }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#c7bfff" }}>Admin Panel</h1>
            <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>SocietyConnect</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(199,191,255,0.05)", borderRadius: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#303b57", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="manage_accounts" style={{ color: "#c7bfff", fontSize: 17 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e4e5f0" }}>{admin.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#73757f" }}>Society Admin</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: active === item.id ? "rgba(199,191,255,0.1)" : "transparent",
              color: active === item.id ? "#c7bfff" : "#a9aab5",
              fontWeight: active === item.id ? 700 : 400,
              fontSize: 14,
              textAlign: "left",
              borderLeft: active === item.id ? "3px solid #c7bfff" : "3px solid transparent",
            }}
          >
            <Icon name={item.icon} style={{ color: active === item.id ? "#c7bfff" : "#a9aab5" }} />
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(69,72,80,0.3)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, color: "#a9aab5", fontSize: 13, textDecoration: "none", marginBottom: 4 }}>
          <Icon name="open_in_new" style={{ fontSize: 18 }} />
          Resident Portal
        </a>
        <button
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "#fa746f", fontSize: 13, width: "100%", textAlign: "left" }}
        >
          <Icon name="logout" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Main AdminApp ─────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [adminUser, setAdminUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [data, setData] = useState(null);
  const [activePage, setActivePage] = useState("overview");
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((c) => [...c, { id, message, type }]);
    setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4000);
  };

  const refresh = (partial) => {
    setData((current) => ({ ...current, ...partial }));
  };

  const logout = () => {
    adminApi.logout();
    setAdminUser(null);
    setData(null);
    setActivePage("overview");
  };

  useEffect(() => {
    const token = adminApi.getAdminToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    adminApi
      .bootstrap()
      .then((payload) => {
        setAdminUser(payload.admin);
        setData(payload);
      })
      .catch(() => {
        adminApi.clearAdminToken();
      })
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!adminUser || data) return;
    setLoading(true);
    adminApi
      .bootstrap()
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [adminUser]);

  useEffect(() => {
    const handle = () => logout();
    window.addEventListener("admin:logout", handle);
    return () => window.removeEventListener("admin:logout", handle);
  }, []);

  if (authChecking || loading) {
    return (
      <>
        <AdminGlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12" }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="sync" style={{ fontSize: 42, color: "#c7bfff", animation: "spin 1.1s linear infinite" }} />
            <p style={{ marginTop: 12, color: "#a9aab5" }}>Loading admin panel…</p>
          </div>
        </div>
      </>
    );
  }

  if (!adminUser) {
    // Not authenticated — send back to the unified login page
    window.location.href = "/";
    return null;
  }

  if (error || !data) {
    return (
      <>
        <AdminGlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", padding: 24 }}>
          <div style={{ background: "#17191f", border: "1px solid #454850", borderRadius: 16, padding: 32, maxWidth: 440, textAlign: "center" }}>
            <Icon name="error" style={{ fontSize: 40, color: "#fa746f" }} />
            <h2 style={{ margin: "12px 0 6px", color: "#e4e5f0" }}>Failed to load admin data</h2>
            <p style={{ margin: 0, color: "#a9aab5" }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const actions = {
    updateResidentStatus: async (id, body) => {
      const result = await adminApi.updateResidentStatus(id, body);
      refresh({ residents: result.residents });
    },
    deleteResident: async (id) => {
      const result = await adminApi.deleteResident(id);
      refresh({ residents: result.residents });
    },
    addResidentBill: async (residentId, body) => {
      await adminApi.addResidentBill(residentId, body);
      // re-fetch full bootstrap to get updated resident bills
      const payload = await adminApi.bootstrap();
      setData(payload);
    },
    assignComplaint: async (id, body) => {
      const result = await adminApi.assignComplaint(id, body);
      refresh({ complaints: result.complaints });
    },
    addBill: async (body) => {
      const result = await adminApi.addBill(body);
      refresh({ bills: result.bills });
    },
    deleteBill: async (id) => {
      const result = await adminApi.deleteBill(id);
      refresh({ bills: result.bills });
    },
    updateBooking: async (id, body) => {
      const result = await adminApi.updateBooking(id, body);
      refresh({ bookings: result.bookings });
    },
    addEvent: async (body) => {
      const result = await adminApi.addEvent(body);
      refresh({ scheduleEvents: result.scheduleEvents });
    },
    deleteEvent: async (id) => {
      const result = await adminApi.deleteEvent(id);
      refresh({ scheduleEvents: result.scheduleEvents });
    },
    addFaq: async (body) => {
      const result = await adminApi.addFaq(body);
      refresh({ faqs: result.faqs });
    },
    deleteFaq: async (idx) => {
      const result = await adminApi.deleteFaq(idx);
      refresh({ faqs: result.faqs });
    },
    sendNotification: async (body) => {
      await adminApi.sendNotification(body);
      // Backend returns { ok: true } — prepend the sent notification to the local log
      const newEntry = {
        id: Date.now(),
        icon: body.icon || "campaign",
        title: body.title,
        time: "Just now",
        read: true,
      };
      refresh({ notifications: [newEntry, ...(data.notifications || [])] });
    },
  };

  return (
    <>
      <AdminGlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: "#0d0e12" }}>
        <AdminSidebar active={activePage} setActive={setActivePage} admin={adminUser} onLogout={logout} />

        <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
          <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(13,14,18,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(42,45,53,0.8)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, color: "#a9aab5", fontWeight: 600 }}>
              <span style={{ color: "#c7bfff" }}>Admin</span> &nbsp;›&nbsp;
              <span style={{ textTransform: "capitalize" }}>{activePage}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#73757f" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
              Live data
            </div>
          </header>

          {activePage === "overview" && <OverviewPage data={data} setActivePage={setActivePage} />}
          {activePage === "residents" && (
            <ResidentsPage
              residents={data.residents}
              onUpdateStatus={actions.updateResidentStatus}
              onDeleteResident={actions.deleteResident}
              onAddBill={actions.addResidentBill}
              addToast={addToast}
            />
          )}
          {activePage === "complaints" && <ComplaintsPage complaints={data.complaints} onAssign={actions.assignComplaint} addToast={addToast} />}
          {activePage === "billing" && <BillingPage bills={data.bills} onAddBill={actions.addBill} onDeleteBill={actions.deleteBill} addToast={addToast} />}
          {activePage === "bookings" && <BookingsPage bookings={data.bookings} onUpdateBooking={actions.updateBooking} addToast={addToast} />}
          {activePage === "schedule" && <SchedulePage events={data.scheduleEvents} onAddEvent={actions.addEvent} onDeleteEvent={actions.deleteEvent} addToast={addToast} />}
          {activePage === "faqs" && <FaqsPage faqs={data.faqs} onAddFaq={actions.addFaq} onDeleteFaq={actions.deleteFaq} addToast={addToast} />}
          {activePage === "notifications" && <NotificationsPage notifications={data.notifications ?? []} onSend={actions.sendNotification} addToast={addToast} />}
        </main>
      </div>

      <Toast toasts={toasts} removeToast={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />
    </>
  );
}

function AdminGlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
      * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
      body { margin: 0; background: #0d0e12; color: #e4e5f0; }
      button, input, textarea, select { font: inherit; }
      a { color: inherit; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #454850; border-radius: 999px; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      select option { background: #17191f; color: #e4e5f0; }
    `}</style>
  );
}

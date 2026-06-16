import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import LoginPage from "./LoginPage.jsx";

const HELP_CATEGORIES = [
  {
    icon: "payments",
    color: "#c7bfff",
    bg: "rgba(199,191,255,0.1)",
    title: "Billing Help",
    desc: "Service charges, online payment methods, invoice history.",
    links: ["How to pay maintenance online", "Understanding your invoice"],
  },
  {
    icon: "construction",
    color: "#bbc6e8",
    bg: "rgba(187,198,232,0.1)",
    title: "Maintenance Rules",
    desc: "Society guidelines for repairs, renovation, and garbage disposal.",
    links: ["Renovation permit process", "Emergency repair protocols"],
  },
  {
    icon: "event_seat",
    color: "#ead4ff",
    bg: "rgba(234,212,255,0.1)",
    title: "Facility Booking",
    desc: "Reserving the clubhouse, pool side area, or tennis courts.",
    links: ["Booking the Community Hall", "Guest policy for pool area"],
  },
];

const COMPLAINT_CATEGORIES = [
  { label: "Plumbing", icon: "plumbing" },
  { label: "Electrical", icon: "bolt" },
  { label: "Carpentry", icon: "carpenter" },
  { label: "Cleaning", icon: "cleaning_services" },
  { label: "HVAC", icon: "ac_unit" },
  { label: "General", icon: "more_horiz" },
  { label: "Technical", icon: "memory" },
];

function Icon({ name, className = "", style = {} }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === "success" ? "#1d1f26" : toast.type === "error" ? "#871f21" : "#17191f",
            border: `1px solid ${toast.type === "success" ? "#c7bfff" : toast.type === "error" ? "#fa746f" : "#454850"}`,
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
            name={toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
            style={{ color: toast.type === "success" ? "#c7bfff" : toast.type === "error" ? "#fa746f" : "#bbc6e8" }}
          />
          <span style={{ fontSize: 14, flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}
          >
            <Icon name="close" />
          </button>
        </div>
      ))}
    </div>
  );
}

function useViewport() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width,
    isMobile: width < 900,
    isTablet: width < 1200,
  };
}

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function loadRazorpayScript() {
  if (window.Razorpay) {
    return true;
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Sidebar({ active, setActive, resident, isMobile, unreadCount, mobileOpen, setMobileOpen, onLogout }) {
  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "complaints", icon: "report_problem", label: "Complaints" },
    { id: "payments", icon: "payments", label: "Payments" },
    { id: "history", icon: "history", label: "History" },
    { id: "schedule", icon: "calendar_today", label: "Schedule" },
    { id: "help", icon: "help", label: "Help Center" },
  ];

  return (
    <>
      {isMobile && mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", border: "none", zIndex: 45 }}
        />
      )}
      <aside
        style={{
          width: 256,
          background: "rgba(17,19,24,0.97)",
          borderRight: "1px solid #454850",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          left: isMobile ? (mobileOpen ? 0 : -280) : 0,
          top: 0,
          zIndex: 50,
          padding: "32px 0 0",
          transition: "left 0.25s ease",
        }}
      >
        <div style={{ padding: "0 16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#c7bfff", margin: 0 }}>SocietyConnect</h1>
            {isMobile && (
              <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}>
                <Icon name="close" />
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#303b57",
                border: "2px solid rgba(199,191,255,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="person" style={{ color: "#c7bfff", fontSize: 22 }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e4e5f0" }}>{resident.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#a9aab5" }}>{resident.unit}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id);
                setMobileOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: active === item.id ? "rgba(199,191,255,0.12)" : "transparent",
                color: active === item.id ? "#c7bfff" : "#a9aab5",
                fontWeight: active === item.id ? 700 : 400,
                fontSize: 14,
                textAlign: "left",
                borderLeft: active === item.id ? "3px solid #c7bfff" : "3px solid transparent",
              }}
            >
              <Icon name={item.icon} style={{ color: active === item.id ? "#c7bfff" : "#a9aab5" }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === "payments" && unreadCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "#303b57", color: "#c7bfff" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}

          <div style={{ padding: "16px 8px 0" }}>
            <button
              onClick={() => {
                setActive("complaints");
                setMobileOpen(false);
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "#c7bfff",
                color: "#3d3092",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Icon name="add" style={{ color: "#3d3092" }} />
              New Request
            </button>
          </div>
        </nav>

        <div style={{ padding: "16px 8px", borderTop: "1px solid rgba(69,72,80,0.3)" }}>
          <button
            onClick={() => {
              setActive("settings");
              setMobileOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: active === "settings" ? "rgba(199,191,255,0.1)" : "transparent",
              color: "#a9aab5",
              fontSize: 14,
              width: "100%",
              textAlign: "left",
            }}
          >
            <Icon name="settings" />
            Settings
          </button>
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: "#fa746f",
              fontSize: 14,
              width: "100%",
              textAlign: "left",
              marginTop: 4,
            }}
          >
            <Icon name="logout" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ page, notifications, showNotifPanel, setShowNotifPanel, markAllRead, resident, isMobile, setMobileOpen }) {
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(35,38,46,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(69,72,80,0.5)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", color: "#c7bfff", cursor: "pointer", padding: 0 }}>
            <Icon name="menu" style={{ fontSize: 26 }} />
          </button>
        )}
        <div style={{ fontSize: 13, color: "#a9aab5", textTransform: "capitalize", fontWeight: 600 }}>
          <span style={{ color: "#c7bfff" }}>SocietyConnect</span> &nbsp;›&nbsp; {page}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotifPanel((value) => !value)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 6 }}>
            <Icon name="notifications" style={{ color: "#c7bfff", fontSize: 22 }} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, background: "#fa746f", borderRadius: "50%", border: "2px solid #0d0e12" }} />
            )}
          </button>

          {showNotifPanel && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 320,
                maxWidth: "90vw",
                background: "#17191f",
                border: "1px solid #454850",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                overflow: "hidden",
                zIndex: 999,
              }}
            >
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #454850", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#e4e5f0" }}>
                  Notifications
                  {unread > 0 && (
                    <span style={{ background: "#fa746f", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11, marginLeft: 6 }}>
                      {unread}
                    </span>
                  )}
                </span>
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#c7bfff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  Mark all read
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#a9aab5" }}>No notifications</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid rgba(69,72,80,0.3)",
                        background: item.read ? "transparent" : "rgba(199,191,255,0.04)",
                        display: "flex",
                        gap: 10,
                      }}
                    >
                      <Icon name={item.icon} style={{ color: item.read ? "#a9aab5" : "#c7bfff", marginTop: 2 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: item.read ? "#a9aab5" : "#e4e5f0", fontWeight: item.read ? 400 : 600 }}>{item.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.3)", borderRadius: 99, padding: "4px 12px 4px 6px", border: "1px solid rgba(69,72,80,0.5)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#303b57", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="person" style={{ color: "#c7bfff", fontSize: 18 }} />
          </div>
          {!isMobile && <span style={{ fontSize: 12, color: "#e4e5f0", fontWeight: 600 }}>{resident.name}</span>}
        </div>
      </div>
    </header>
  );
}

function Dashboard({ complaints, bills, history, setActivePage, scheduleEvents, isMobile, resident }) {
  const unpaid = bills.filter((bill) => bill.status === "Unpaid");
  const active = complaints.filter((complaint) => complaint.status !== "Resolved");
  const recentHistory = history.slice(0, 4);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 24 : 28, fontWeight: 700, color: "#c7bfff" }}>Welcome, {resident.name.split(" ")[0]}</h2>
        <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 15 }}>Here&apos;s what&apos;s happening in {resident.unit} today.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Complaints", value: active.length, icon: "report_problem", color: "#fa746f" },
          { label: "Unpaid Bills", value: unpaid.length, icon: "payments", color: "#c7bfff" },
          { label: "Resolved Issues", value: complaints.filter((item) => item.status === "Resolved").length, icon: "check_circle", color: "#bbc6e8" },
          { label: "Next Bill Due", value: unpaid[0] ? unpaid[0].dueDate : "All clear", icon: "event", color: "#ead4ff", isText: true },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{stat.label}</span>
              <Icon name={stat.icon} style={{ color: stat.color, fontSize: 20 }} />
            </div>
            <p style={{ margin: 0, fontSize: stat.isText ? 18 : 32, fontWeight: 700, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => setActivePage("complaints")}
          style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ width: 48, height: 48, background: "rgba(199,191,255,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: "1px solid rgba(199,191,255,0.2)" }}>
            <Icon name="report_problem" style={{ color: "#c7bfff", fontSize: 28 }} />
          </div>
          <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 18, fontWeight: 600 }}>New Complaint</h3>
          <p style={{ margin: "6px 0 0", color: "#a9aab5", fontSize: 13 }}>Log a maintenance issue or security concern instantly.</p>
        </button>

        <button
          onClick={() => setActivePage("payments")}
          style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ width: 48, height: 48, background: "rgba(187,198,232,0.15)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, border: "1px solid rgba(187,198,232,0.2)" }}>
            <Icon name="payments" style={{ color: "#bbc6e8", fontSize: 28 }} />
          </div>
          <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 18, fontWeight: 600 }}>Pay Bills</h3>
          <p style={{ margin: "6px 0 0", color: "#a9aab5", fontSize: 13 }}>Clear maintenance dues with integrated online checkout.</p>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", gap: 16 }}>
        <div style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="assignment" style={{ color: "#c7bfff" }} />
              Active Complaints
            </h3>
            <button onClick={() => setActivePage("complaints")} style={{ background: "none", border: "none", color: "#c7bfff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
              VIEW ALL
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {active.slice(0, 3).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10, borderLeft: `4px solid ${item.priority === "Urgent" ? "#fa746f" : "#bbc6e8"}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: item.priority === "Urgent" ? "rgba(250,116,111,0.15)" : "rgba(187,198,232,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={item.categoryIcon} style={{ color: item.priority === "Urgent" ? "#fa746f" : "#bbc6e8" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e5f0" }}>{item.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#303b57", color: "#b4bfe1" }}>{item.status}</span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#a9aab5" }}>{item.technician ? `Technician: ${item.technician}` : "Pending assignment"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "#e4e5f0", fontSize: 16, fontWeight: 600 }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentHistory.map((item) => (
              <div key={item.id} style={{ padding: 12, background: "#111318", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon name={item.icon} style={{ color: item.type === "Payment" ? "#c7bfff" : item.type === "Complaint" ? "#fa746f" : "#ead4ff" }} />
                  <span style={{ color: "#e4e5f0", fontSize: 13, fontWeight: 600 }}>{item.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>{item.ref}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a9aab5" }}>{item.amount || item.status}</p>
              </div>
            ))}
            {scheduleEvents[0] && (
              <div style={{ marginTop: 8, padding: 14, background: "#4f44a5", borderRadius: 12 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(229,223,255,0.8)", textTransform: "uppercase" }}>Next maintenance</p>
                <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 700, color: "#fff" }}>{scheduleEvents[0].title}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(229,223,255,0.8)" }}>{scheduleEvents[0].date}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplaintsPage({ complaints, onCreateComplaint, onResolveComplaint, addToast, isMobile }) {
  const [filter, setFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Plumbing", priority: "Medium", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered =
    filter === "ALL"
      ? complaints
      : filter === "PENDING"
        ? complaints.filter((item) => item.status !== "Resolved")
        : complaints.filter((item) => item.status === "Resolved");

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await onCreateComplaint(form);
      setForm({ title: "", category: "Plumbing", priority: "Medium", description: "" });
      setShowForm(false);
      addToast("Complaint submitted successfully!", "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: showForm && !isMobile ? "1fr 1fr" : "1fr",
        gap: 24,
        alignItems: "start",
      }}
    >
      {showForm && (
        <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="add_circle" style={{ color: "#c7bfff" }} />
              Report a Problem
            </h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#a9aab5", cursor: "pointer" }}>
              <Icon name="close" />
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Title *</label>
            <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Brief title of the issue" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Category</label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 8 }}>
              {COMPLAINT_CATEGORIES.map((category) => (
                <button
                  key={category.label}
                  onClick={() => setForm((current) => ({ ...current, category: category.label }))}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "10px 6px",
                    borderRadius: 8,
                    border: form.category === category.label ? "2px solid #c7bfff" : "1px solid #454850",
                    background: form.category === category.label ? "rgba(199,191,255,0.1)" : "#111318",
                    color: form.category === category.label ? "#c7bfff" : "#a9aab5",
                    cursor: "pointer",
                  }}
                >
                  <Icon name={category.icon} style={{ fontSize: 22, marginBottom: 4 }} />
                  <span style={{ fontSize: 11, fontWeight: form.category === category.label ? 700 : 400 }}>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["Urgent", "Medium", "Low"].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setForm((current) => ({ ...current, priority }))}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: 8,
                    border: form.priority === priority ? `2px solid ${priority === "Urgent" ? "#fa746f" : priority === "Medium" ? "#c7bfff" : "#73757f"}` : "1px solid #454850",
                    background: form.priority === priority ? (priority === "Urgent" ? "rgba(250,116,111,0.1)" : "rgba(199,191,255,0.1)") : "#111318",
                    color: form.priority === priority ? (priority === "Urgent" ? "#fa746f" : "#c7bfff") : "#a9aab5",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Description *</label>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Describe the issue in detail..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              background: submitting ? "#454850" : "#c7bfff",
              color: "#3d3092",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name={submitting ? "sync" : "send"} style={{ fontSize: 20, animation: submitting ? "spin 1s linear infinite" : "none" }} />
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#c7bfff", fontSize: 24, fontWeight: 700 }}>Support Center</h2>
            <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Manage and track your maintenance requests.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={primaryButtonStyle}>
              <Icon name="add" style={{ color: "#3d3092" }} />
              New Request
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, background: "#111318", borderRadius: 10, padding: 4, marginBottom: 16, border: "1px solid rgba(69,72,80,0.4)", width: "fit-content" }}>
          {["ALL", "PENDING", "RESOLVED"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: "none",
                background: filter === item ? "#303b57" : "transparent",
                color: filter === item ? "#b4bfe1" : "#a9aab5",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((complaint) => (
            <div key={complaint.id} style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: `4px solid ${complaint.priority === "Urgent" ? "#fa746f" : complaint.status === "Resolved" ? "#454850" : "#bbc6e8"}`, borderRadius: 12, padding: 16, display: "flex", gap: 14, opacity: complaint.status === "Resolved" ? 0.7 : 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: complaint.priority === "Urgent" ? "rgba(135,31,33,0.4)" : "rgba(48,59,87,0.6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={complaint.categoryIcon} style={{ color: complaint.priority === "Urgent" ? "#ff9993" : "#b4bfe1" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, gap: 10 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: complaint.status === "Resolved" ? "#a9aab5" : "#e4e5f0" }}>{complaint.title}</h4>
                    <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>#{complaint.id} • {complaint.date}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: complaint.priority === "Urgent" ? "#871f21" : complaint.status === "Resolved" ? "#23262e" : "#303b57", color: complaint.priority === "Urgent" ? "#ff9993" : complaint.status === "Resolved" ? "#73757f" : "#b4bfe1" }}>
                    {complaint.status === "Resolved" ? "RESOLVED" : complaint.priority}
                  </span>
                </div>
                <p style={{ margin: "4px 0 8px", fontSize: 13, color: "#a9aab5" }}>{complaint.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 12, flexDirection: isMobile ? "column" : "row", borderTop: "1px solid rgba(69,72,80,0.3)", paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: complaint.status === "In Progress" ? "#c7bfff" : "#a9aab5", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    <Icon name={complaint.status === "Resolved" ? "check_circle" : complaint.status === "In Progress" ? "cached" : "person_check"} style={{ fontSize: 16 }} />
                    {complaint.technician ? `Technician: ${complaint.technician}` : "Pending Assignment"}
                  </span>
                  {complaint.status !== "Resolved" && (
                    <button
                      onClick={async () => {
                        try {
                          await onResolveComplaint(complaint.id);
                          addToast("Complaint marked as resolved.", "success");
                        } catch (error) {
                          addToast(error.message, "error");
                        }
                      }}
                      style={{ fontSize: 11, color: "#c7bfff", background: "none", border: "1px solid rgba(199,191,255,0.3)", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#73757f" }}>No complaints found.</div>}
        </div>
      </div>
    </div>
  );
}

function PaymentsPage({ bills, paymentGateway, resident, refreshData, addToast, isMobile }) {
  const [selectedBill, setSelectedBill] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [demoMethod, setDemoMethod] = useState("UPI");

  const resetFlow = () => {
    setSelectedBill(null);
    setProcessing(false);
  };

  const handlePayment = async () => {
    if (!selectedBill) {
      return;
    }

    setProcessing(true);
    try {
      const payload = await api.createPaymentOrder({ billId: selectedBill.id });
      if (payload.paymentGateway.mode === "demo") {
        const updated = await api.completeDemoPayment({ billId: selectedBill.id, method: demoMethod });
        refreshData(updated);
        setPaymentResult({
          billId: selectedBill.id,
          transactionId: updated.bills.find((item) => item.id === selectedBill.id)?.lastTransaction?.paymentId,
          amount: payload.totals.total,
        });
        resetFlow();
        addToast("Demo payment completed successfully.", "success");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const options = {
        key: payload.paymentGateway.keyId,
        amount: payload.order.amount,
        currency: payload.order.currency,
        name: "SocietyConnect",
        description: `${payload.bill.type} - ${payload.bill.period}`,
        order_id: payload.order.id,
        theme: {
          color: "#6f63d8",
        },
        prefill: {
          name: payload.resident.name,
          email: payload.resident.email,
          contact: payload.resident.phone,
        },
        notes: {
          unit: payload.resident.unit,
          invoiceId: payload.bill.id,
        },
        handler: async (response) => {
          try {
            const updated = await api.verifyPayment({ billId: selectedBill.id, ...response });
            refreshData(updated);
            setPaymentResult({
              billId: selectedBill.id,
              transactionId: response.razorpay_payment_id,
              amount: payload.totals.total,
            });
            resetFlow();
            addToast("Payment verified successfully.", "success");
          } catch (verifyError) {
            setProcessing(false);
            addToast(verifyError.message || "Payment verification failed.", "error");
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setProcessing(false);
        addToast("Payment was not completed.", "error");
      });
      razorpay.open();
    } catch (error) {
      addToast(error.message, "error");
      setProcessing(false);
    }
  };

  if (paymentResult) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(199,191,255,0.2)", borderRadius: 16, padding: 40, textAlign: "center" }}>
          <div style={{ width: 80, height: 80, background: "rgba(199,191,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Icon name="check_circle" style={{ color: "#c7bfff", fontSize: 40 }} />
          </div>
          <h2 style={{ margin: "0 0 8px", color: "#e4e5f0", fontSize: 26, fontWeight: 700 }}>Payment Successful</h2>
          <p style={{ color: "#a9aab5", fontSize: 14, marginBottom: 24 }}>Transaction completed for {paymentResult.billId}. Your receipt is available in history.</p>
          <div style={{ background: "#111318", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 10 }}>
              <span style={{ color: "#a9aab5", fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>Transaction ID</span>
              <span style={{ color: "#c7bfff", fontWeight: 700, fontSize: 13 }}>{paymentResult.transactionId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ color: "#a9aab5", fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>Amount Paid</span>
              <span style={{ color: "#e4e5f0", fontWeight: 700 }}>{formatCurrency(paymentResult.amount)}</span>
            </div>
          </div>
          <button onClick={() => setPaymentResult(null)} style={primaryButtonStyle}>
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  if (selectedBill) {
    const totals = {
      subtotal: selectedBill.amount,
      platformFee: paymentGateway.platformFee,
      gstAmount: paymentGateway.gstAmount,
      total: selectedBill.amount + paymentGateway.platformFee + paymentGateway.gstAmount,
    };

    return (
      <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "#a9aab5", fontSize: 12 }}>
          <button onClick={() => setSelectedBill(null)} style={{ background: "none", border: "none", color: "#c7bfff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
            <Icon name="arrow_back" style={{ fontSize: 18 }} />
            Back
          </button>
          <span>›</span>
          <span style={{ color: "#c7bfff", fontWeight: 600 }}>
            {paymentGateway.mode === "live" ? "Razorpay Checkout" : "Demo Checkout"}
          </span>
        </div>

        <h1 style={{ margin: "0 0 4px", color: "#e4e5f0", fontSize: 26, fontWeight: 700 }}>Maintenance Bill Payment</h1>
        <p style={{ margin: "0 0 20px", color: "#a9aab5", fontSize: 14 }}>
          {paymentGateway.mode === "live"
            ? "Your payment will open in Razorpay's secure checkout."
            : "Razorpay keys are not configured yet, so the app is running in demo payment mode."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", background: "#111318", borderBottom: "1px solid #454850", display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#a9aab5", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", display: "block" }}>Invoice Details</span>
                  <span style={{ color: "#c7bfff", fontWeight: 700 }}>{selectedBill.id}</span>
                </div>
                <span style={{ background: "rgba(250,116,111,0.1)", color: "#fa746f", border: "1px solid rgba(250,116,111,0.2)", padding: "2px 12px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase", alignSelf: "center" }}>
                  Unpaid
                </span>
              </div>

              <div style={{ padding: 20 }}>
                {selectedBill.breakdown.map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#a9aab5", fontSize: 14 }}>{item.label}</span>
                    <span style={{ color: "#e4e5f0", fontSize: 14 }}>{formatCurrency(item.amt)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #454850" }}>
                  <span style={{ color: "#e4e5f0", fontWeight: 700 }}>Total Bill Amount</span>
                  <span style={{ color: "#c7bfff", fontWeight: 700, fontSize: 18 }}>{formatCurrency(selectedBill.amount)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "#111318", border: "1px solid #454850", borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 14, color: "#e4e5f0" }}>Resident Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Resident", value: resident.name },
                  { label: "Unit", value: resident.unit },
                  { label: "Phone", value: resident.phone },
                  { label: "Email", value: resident.email },
                ].map((item) => (
                  <div key={item.label}>
                    <label style={labelStyle}>{item.label}</label>
                    <div style={{ ...inputStyle, background: "#17191f", color: "#e4e5f0" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {paymentGateway.mode === "demo" && (
              <div style={{ background: "#111318", border: "1px solid #454850", borderRadius: 12, padding: 16 }}>
                <label style={labelStyle}>Demo payment method</label>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
                  {["UPI", "Card", "Net Banking"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setDemoMethod(method)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: demoMethod === method ? "2px solid #c7bfff" : "1px solid #454850",
                        background: demoMethod === method ? "rgba(199,191,255,0.06)" : "#17191f",
                        color: demoMethod === method ? "#c7bfff" : "#e4e5f0",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, alignSelf: "start", position: isMobile ? "static" : "sticky", top: 90 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 11, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Payment Summary</h3>
            <div style={{ marginBottom: 20 }}>
              {[
                { label: "Subtotal", value: formatCurrency(totals.subtotal) },
                { label: "Platform Fee", value: formatCurrency(totals.platformFee) },
                { label: "GST (18%)", value: formatCurrency(totals.gstAmount) },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: "#a9aab5", fontSize: 14 }}>{row.label}</span>
                  <span style={{ color: "#e4e5f0", fontSize: 14 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #454850" }}>
                <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#c7bfff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total Payable</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: "#e4e5f0" }}>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              style={{
                width: "100%",
                background: processing ? "#454850" : "#c7bfff",
                color: "#3d3092",
                padding: 14,
                borderRadius: 12,
                border: "none",
                fontWeight: 700,
                fontSize: 15,
                cursor: processing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span>{processing ? "Processing..." : paymentGateway.mode === "live" ? "Pay with Razorpay" : "Complete Demo Payment"}</span>
              <Icon name={processing ? "sync" : "lock"} style={{ fontSize: 18, animation: processing ? "spin 1s linear infinite" : "none" }} />
            </button>

            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#73757f", marginBottom: 8 }}>
                <Icon name="verified_user" style={{ fontSize: 16 }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {paymentGateway.mode === "live" ? "Secure checkout" : "Demo mode enabled"}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#73757f", margin: 0 }}>
                {paymentGateway.mode === "live"
                  ? "Checkout opens on Razorpay and payment is verified on the backend."
                  : "Add Razorpay keys in the environment file to enable live payment collection."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 4px", color: "#c7bfff", fontSize: 26, fontWeight: 700 }}>Billing & Payments</h2>
      <p style={{ margin: "0 0 24px", color: "#a9aab5", fontSize: 14 }}>
        Manage maintenance dues for {resident.unit}. Gateway mode: <span style={{ color: "#c7bfff", fontWeight: 700, textTransform: "uppercase" }}>{paymentGateway.mode}</span>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {bills.map((bill) => (
          <div key={bill.id} style={{ background: "rgba(23,25,31,0.8)", border: `1px solid ${bill.status === "Unpaid" ? "rgba(250,116,111,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: bill.status === "Unpaid" ? "rgba(135,31,33,0.3)" : "rgba(48,59,87,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="receipt_long" style={{ color: bill.status === "Unpaid" ? "#ff9993" : "#b4bfe1" }} />
            </div>
            <div style={{ flex: 1, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-start", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e4e5f0" }}>{bill.type} — {bill.period}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{bill.id}</p>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: bill.status === "Unpaid" ? "#fa746f" : "#c7bfff" }}>{formatCurrency(bill.amount)}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99, background: bill.status === "Unpaid" ? "rgba(250,116,111,0.1)" : "rgba(187,198,232,0.1)", color: bill.status === "Unpaid" ? "#fa746f" : "#bbc6e8", border: `1px solid ${bill.status === "Unpaid" ? "rgba(250,116,111,0.2)" : "rgba(187,198,232,0.2)"}` }}>{bill.status}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginTop: 10, gap: 12, flexDirection: isMobile ? "column" : "row" }}>
                <div>
                  <span style={{ fontSize: 12, color: bill.status === "Unpaid" ? "#fa746f" : "#73757f" }}>Due: {bill.dueDate}</span>
                  {bill.lastTransaction && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#73757f" }}>Last transaction: {bill.lastTransaction.paymentId}</p>}
                </div>
                {bill.status === "Unpaid" ? (
                  <button onClick={() => setSelectedBill(bill)} style={primaryButtonStyle}>
                    Pay Now
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "#bbc6e8", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="check_circle" style={{ fontSize: 16, color: "#bbc6e8" }} />
                    Paid
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPage({ history, complaints, bills, scheduleEvents, addToast, isMobile }) {
  const [filter, setFilter] = useState("All Activity");
  const [search, setSearch] = useState("");
  const tabs = ["All Activity", "Complaints", "Payments", "Notices"];
  const filtered = history.filter((entry) => {
    const matchTab = filter === "All Activity" || entry.type === filter.replace(/s$/, "");
    const haystack = `${entry.title} ${entry.ref}`.toLowerCase();
    return matchTab && haystack.includes(search.toLowerCase());
  });

  const totalInvoiced = bills.reduce((sum, item) => sum + item.amount, 0);
  const resolvedCount = complaints.filter((item) => item.status === "Resolved").length;

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "society-history.json";
    link.click();
    URL.revokeObjectURL(url);
    addToast("History export downloaded.", "success");
  };

  const statusColors = { Resolved: "#b4bfe1", Paid: "#c7bfff", Archived: "#73757f", Closed: "#ff9993", Pending: "#ead4ff" };
  const statusBg = { Resolved: "#303b57", Paid: "rgba(199,191,255,0.1)", Archived: "#23262e", Closed: "rgba(135,31,33,0.3)", Pending: "rgba(234,212,255,0.1)" };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: 20, gap: 12, flexDirection: isMobile ? "column" : "row" }}>
        <div>
          <h2 style={{ margin: 0, color: "#e4e5f0", fontSize: 26, fontWeight: 700 }}>Activity History</h2>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Complete record of transactions, complaints, and notices.</p>
        </div>
        <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto", flexDirection: isMobile ? "column" : "row" }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search..." style={{ ...inputStyle, minWidth: isMobile ? "100%" : 180 }} />
          <button onClick={exportHistory} style={{ ...secondaryButtonStyle, justifyContent: "center" }}>
            <Icon name="download" style={{ fontSize: 18 }} />
            Export
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Invoiced", value: formatCurrency(totalInvoiced), sub: `${bills.length} bills` },
          { label: "Complaints", value: `${resolvedCount} Resolved`, sub: `${complaints.length - resolvedCount} Pending` },
          { label: "Notices Read", value: `${history.filter((item) => item.type === "Notice").length} Active`, sub: "Resident engagement" },
          { label: "Next Maintenance", value: scheduleEvents[0]?.date || "Soon", sub: scheduleEvents[0]?.title || "No events", highlight: true },
        ].map((summary) => (
          <div key={summary.label} style={{ background: summary.highlight ? "#4f44a5" : "rgba(23,25,31,0.7)", border: `1px solid ${summary.highlight ? "rgba(199,191,255,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: 16 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: summary.highlight ? "rgba(229,223,255,0.8)" : "#a9aab5", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>{summary.label}</p>
            <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: summary.highlight ? "#fff" : "#c7bfff" }}>{summary.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: summary.highlight ? "rgba(229,223,255,0.7)" : "#73757f" }}>{summary.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #454850", overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} style={{ padding: "12px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, color: filter === tab ? "#c7bfff" : "#a9aab5", borderBottom: filter === tab ? "2px solid #c7bfff" : "2px solid transparent", whiteSpace: "nowrap" }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#111318" }}>
                {["Type", "Details & ID", "Date", "Status"].map((heading) => (
                  <th key={heading} style={{ padding: "12px 20px", textAlign: heading === "Status" ? "right" : "left", fontSize: 11, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid rgba(69,72,80,0.3)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: entry.type === "Complaint" ? "rgba(135,31,33,0.2)" : entry.type === "Payment" ? "rgba(79,68,165,0.2)" : "rgba(93,47,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={entry.icon} style={{ color: entry.type === "Complaint" ? "#ff9993" : entry.type === "Payment" ? "#c7bfff" : "#ead4ff", fontSize: 20 }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#e4e5f0" }}>{entry.type}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#e4e5f0" }}>{entry.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{entry.ref}</p>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ margin: 0, fontSize: 14, color: "#e4e5f0" }}>{entry.date}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#73757f" }}>{entry.time}</p>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    {entry.amount ? (
                      <div>
                        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#c7bfff" }}>{entry.amount}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>Paid</p>
                      </div>
                    ) : (
                      <span style={{ padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusBg[entry.status] || "#23262e", color: statusColors[entry.status] || "#a9aab5", border: `1px solid ${(statusColors[entry.status] || "#454850")}40` }}>
                        {entry.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#73757f" }}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", background: "#111318", borderTop: "1px solid #454850" }}>
          <span style={{ fontSize: 12, color: "#a9aab5" }}>Showing {filtered.length} of {history.length} entries</span>
        </div>
      </div>
    </div>
  );
}

function SchedulePage({ scheduleEvents, bookings, onCreateBooking, addToast, isMobile }) {
  const colorMap = { primary: "#c7bfff", secondary: "#bbc6e8", tertiary: "#ead4ff", error: "#fa746f" };
  const bgMap = { primary: "rgba(199,191,255,0.12)", secondary: "rgba(187,198,232,0.12)", tertiary: "rgba(234,212,255,0.12)", error: "rgba(250,116,111,0.12)" };
  const [view, setView] = useState("Timeline");
  const [bookTitle, setBookTitle] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [booking, setBooking] = useState(false);

  const handleBook = async () => {
    if (!bookTitle || !bookDate) {
      addToast("Please fill in the facility and date.", "error");
      return;
    }
    setBooking(true);
    try {
      await onCreateBooking({ facility: bookTitle, date: bookDate });
      setBookTitle("");
      setBookDate("");
      addToast("Facility booking submitted for approval!", "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 24, alignItems: "start" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 12, flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <h2 style={{ margin: 0, color: "#e4e5f0", fontSize: 26, fontWeight: 700 }}>Community Schedule</h2>
            <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 14 }}>Building maintenance and personal service requests.</p>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#111318", borderRadius: 8, padding: 3, border: "1px solid #454850" }}>
            {["Timeline", "Month", "Week"].map((item) => (
              <button key={item} onClick={() => setView(item)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: view === item ? "#c7bfff" : "transparent", color: view === item ? "#3d3092" : "#a9aab5", fontSize: 12, fontWeight: view === item ? 700 : 400, cursor: "pointer" }}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#e4e5f0", fontSize: 16, fontWeight: 600 }}>
              <Icon name="engineering" style={{ color: "#c7bfff" }} />
              Active Maintenance Timeline
            </h3>
            <span style={{ fontSize: 11, color: "#a9aab5", textTransform: "uppercase", letterSpacing: "0.08em" }}>{view} view</span>
          </div>
          <div style={{ position: "relative", paddingLeft: 52 }}>
            <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, background: "rgba(69,72,80,0.4)" }} />
            {scheduleEvents.map((event) => (
              <div key={event.id} style={{ position: "relative", marginBottom: 16 }}>
                <div style={{ position: "absolute", left: -52, top: 0, width: 40, height: 40, borderRadius: "50%", background: bgMap[event.color], border: `2px solid ${colorMap[event.color]}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={event.icon} style={{ color: colorMap[event.color], fontSize: 20 }} />
                </div>
                <div style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8, flexDirection: isMobile ? "column" : "row" }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colorMap[event.color] }}>{event.title}</h4>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: bgMap[event.color], color: colorMap[event.color] }}>{event.tag}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#23262e", color: "#a9aab5" }}>{event.date}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#a9aab5", marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="schedule" style={{ fontSize: 14 }} />{event.time}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="location_on" style={{ fontSize: 14 }} />{event.location}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#a9aab5" }}>{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
          <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 11, color: "#c7bfff", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>System Health</h4>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#e4e5f0" }}>98.2% <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>↑ +0.4%</span></p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a9aab5" }}>Facility uptime over last 30 days.</p>
          </div>
          <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 11, color: "#bbc6e8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>Booking Requests</h4>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#e4e5f0" }}>{bookings.length}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a9aab5" }}>Requests currently saved in the backend.</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", color: "#e4e5f0", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="event_available" style={{ color: "#c7bfff" }} />
            Book a Facility
          </h4>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Facility</label>
            <select value={bookTitle} onChange={(event) => setBookTitle(event.target.value)} style={inputStyle}>
              <option value="">Select facility...</option>
              <option>Community Hall</option>
              <option>Swimming Pool</option>
              <option>Tennis Court</option>
              <option>Gym</option>
              <option>BBQ Area</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={bookDate} onChange={(event) => setBookDate(event.target.value)} style={inputStyle} />
          </div>
          <button onClick={handleBook} disabled={booking} style={{ ...primaryButtonStyle, width: "100%", justifyContent: "center", opacity: booking ? 0.7 : 1 }}>
            <Icon name={booking ? "sync" : "event_available"} style={{ fontSize: 18, animation: booking ? "spin 1s linear infinite" : "none" }} />
            {booking ? "Submitting..." : "Request Booking"}
          </button>
        </div>

        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", color: "#e4e5f0", fontSize: 15, fontWeight: 600 }}>Recent Booking Requests</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bookings.slice(0, 4).map((bookingItem) => (
              <div key={bookingItem.id} style={{ padding: 12, background: "#111318", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#e4e5f0", fontWeight: 600 }}>{bookingItem.facility}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#a9aab5" }}>{bookingItem.date}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#c7bfff" }}>{bookingItem.status}</p>
              </div>
            ))}
            {bookings.length === 0 && <p style={{ margin: 0, fontSize: 12, color: "#73757f" }}>No booking requests yet.</p>}
          </div>
        </div>

        <div style={{ background: "#871f21", border: "1px solid rgba(250,116,111,0.3)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="emergency_home" style={{ color: "#ff9993" }} />
            <h4 style={{ margin: 0, color: "#ff9993", fontSize: 16, fontWeight: 700 }}>Emergency?</h4>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,153,147,0.85)" }}>For urgent leaks, power outages, or safety issues, call the 24/7 staff line.</p>
          <a href="tel:911" style={{ display: "block", textAlign: "center", background: "#ff9993", color: "#871f21", padding: "11px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Call Security Desk</a>
        </div>
      </div>
    </div>
  );
}

function HelpPage({ faqs, addToast, isMobile }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { from: "bot", text: "Hi there! I'm the SocietyConnect support assistant. How can I help you today?" },
  ]);
  const [chatSending, setChatSending] = useState(false);
  const chatRef = useRef(null);

  const filteredFaqs = faqs.filter((faq) => `${faq.q} ${faq.a}`.toLowerCase().includes(search.toLowerCase()));

  const sendMsg = async () => {
    if (!chatMsg.trim() || chatSending) {
      return;
    }

    const userMsg = chatMsg.trim();
    setChatHistory((history) => [...history, { from: "user", text: userMsg }]);
    setChatMsg("");
    setChatSending(true);

    try {
      const response = await api.sendHelpMessage({ message: userMsg });
      setChatHistory((history) => [...history, { from: "bot", text: response.reply }]);
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setChatSending(false);
    }
  };

  const sendFeedback = async (helpful) => {
    try {
      await api.sendFeedback({ helpful });
      addToast(helpful ? "Thank you for your feedback!" : "We'll work on improving this.", helpful ? "success" : "info");
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ textAlign: "center", padding: "32px 0 28px", marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: isMobile ? 28 : 36, fontWeight: 700, color: "#e4e5f0" }}>How can we help you today?</h2>
        <p style={{ margin: "0 0 20px", color: "#a9aab5", fontSize: 15 }}>Find answers about billing, maintenance, facility booking, and more.</p>
        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <Icon name="search" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#c7bfff", fontSize: 24 }} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Describe your issue or type a keyword..." style={{ ...inputStyle, height: 56, paddingLeft: 52, paddingRight: 20 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {HELP_CATEGORIES.map((category) => (
          <div key={category.title} style={{ background: "rgba(23,25,31,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 22 }}>
            <div style={{ width: 48, height: 48, background: category.bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name={category.icon} style={{ color: category.color, fontSize: 26 }} />
            </div>
            <h4 style={{ margin: "0 0 6px", color: "#e4e5f0", fontSize: 16, fontWeight: 700 }}>{category.title}</h4>
            <p style={{ margin: "0 0 14px", color: "#a9aab5", fontSize: 13, lineHeight: 1.5 }}>{category.desc}</p>
            {category.links.map((link) => (
              <div key={link} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#73757f", marginBottom: 4 }}>
                <Icon name="chevron_right" style={{ fontSize: 16 }} />
                {link}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", color: "#e4e5f0", fontSize: 18, fontWeight: 700 }}>Frequently Asked Questions</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredFaqs.map((faq, index) => (
              <div key={faq.q} style={{ borderBottom: "1px solid rgba(69,72,80,0.4)" }}>
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", background: "none", border: "none", cursor: "pointer", color: "#e4e5f0", fontSize: 14, fontWeight: 600, textAlign: "left", gap: 12 }}>
                  <span style={{ color: openFaq === index ? "#c7bfff" : "#e4e5f0" }}>{faq.q}</span>
                  <Icon name="expand_more" style={{ color: "#a9aab5", fontSize: 20, transform: openFaq === index ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>
                {openFaq === index && <p style={{ margin: "0 0 14px", fontSize: 13, color: "#a9aab5", lineHeight: 1.6 }}>{faq.a}</p>}
              </div>
            ))}
            {filteredFaqs.length === 0 && <p style={{ color: "#73757f", textAlign: "center", padding: 20 }}>No results for &quot;{search}&quot;</p>}
          </div>
        </div>

        <div style={{ background: "rgba(23,25,31,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", height: 460 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(69,72,80,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ color: "#e4e5f0", fontWeight: 700, fontSize: 15 }}>Live Support Chat</span>
            <span style={{ fontSize: 12, color: "#4ade80", marginLeft: "auto" }}>Online</span>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {chatHistory.map((message, index) => (
              <div key={`${message.from}-${index}`} style={{ display: "flex", justifyContent: message.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", padding: "9px 13px", borderRadius: 10, background: message.from === "user" ? "#c7bfff" : "#23262e", color: message.from === "user" ? "#3d3092" : "#e4e5f0", fontSize: 13, lineHeight: 1.4 }}>{message.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(69,72,80,0.4)", display: "flex", gap: 8 }}>
            <input value={chatMsg} onChange={(event) => setChatMsg(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMsg()} placeholder="Type your message..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={sendMsg} disabled={chatSending} style={{ background: "#c7bfff", color: "#3d3092", padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 }}>
              <Icon name={chatSending ? "sync" : "send"} style={{ fontSize: 18, animation: chatSending ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: "#23262e", borderRadius: 14, padding: 24, display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, color: "#e4e5f0", fontSize: 18, fontWeight: 700 }}>Was this helpful?</h3>
          <p style={{ margin: "4px 0 0", color: "#a9aab5", fontSize: 13 }}>Your feedback helps us improve the resident experience.</p>
        </div>
        <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto", flexDirection: isMobile ? "column" : "row" }}>
          <button onClick={() => sendFeedback(true)} style={{ ...secondaryButtonStyle, justifyContent: "center" }}>
            <Icon name="thumb_up" style={{ fontSize: 18 }} />
            Yes
          </button>
          <button onClick={() => sendFeedback(false)} style={{ ...secondaryButtonStyle, justifyContent: "center" }}>
            <Icon name="thumb_down" style={{ fontSize: 18 }} />
            No
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ resident, onSaveProfile, onSavePreferences, addToast, isMobile }) {
  const [profile, setProfile] = useState({ name: resident.name, phone: resident.phone, email: resident.email });
  const [preferences, setPreferences] = useState(resident.preferences);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    setProfile({ name: resident.name, phone: resident.phone, email: resident.email });
    setPreferences(resident.preferences);
  }, [resident]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await onSaveProfile(profile);
      addToast("Profile updated successfully!", "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      await onSavePreferences(preferences);
      addToast("Notification preferences updated.", "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
      <h2 style={{ margin: "0 0 4px", color: "#c7bfff", fontSize: 26, fontWeight: 700 }}>Settings</h2>
      <p style={{ margin: "0 0 24px", color: "#a9aab5", fontSize: 14 }}>Manage your profile and notification preferences.</p>

      <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 18px", color: "#e4e5f0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="person" style={{ color: "#c7bfff" }} />
          Profile Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {[
            { label: "Full Name", key: "name" },
            { label: "Phone Number", key: "phone" },
            { label: "Email Address", key: "email", full: true },
            { label: "Unit", value: resident.unit, readonly: true },
          ].map((field) => (
            <div key={field.label} style={{ gridColumn: field.full && !isMobile ? "1 / -1" : "auto" }}>
              <label style={labelStyle}>{field.label}</label>
              <input
                value={field.readonly ? field.value : profile[field.key]}
                onChange={field.readonly ? undefined : (event) => setProfile((current) => ({ ...current, [field.key]: event.target.value }))}
                readOnly={field.readonly}
                style={{ ...inputStyle, background: field.readonly ? "#0d0e12" : "#111318", color: field.readonly ? "#73757f" : "#e4e5f0" }}
              />
            </div>
          ))}
        </div>
        <button onClick={saveProfile} disabled={savingProfile} style={primaryButtonStyle}>
          <Icon name={savingProfile ? "sync" : "save"} style={{ fontSize: 18, animation: savingProfile ? "spin 1s linear infinite" : "none" }} />
          {savingProfile ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ background: "rgba(23,25,31,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
        <h3 style={{ margin: "0 0 18px", color: "#e4e5f0", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="notifications" style={{ color: "#c7bfff" }} />
          Notification Preferences
        </h3>

        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(69,72,80,0.3)", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e4e5f0", textTransform: "capitalize" }}>{key} Alerts</p>
              <p style={{ margin: 0, fontSize: 12, color: "#a9aab5" }}>Receive notifications for {key} updates</p>
            </div>
            <button onClick={() => setPreferences((current) => ({ ...current, [key]: !current[key] }))} style={{ width: 44, height: 24, borderRadius: 99, border: "none", background: value ? "#c7bfff" : "#454850", cursor: "pointer", position: "relative" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s" }} />
            </button>
          </div>
        ))}

        <button onClick={savePreferences} disabled={savingPreferences} style={{ ...secondaryButtonStyle, marginTop: 18 }}>
          <Icon name={savingPreferences ? "sync" : "done"} style={{ fontSize: 18, animation: savingPreferences ? "spin 1s linear infinite" : "none" }} />
          {savingPreferences ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#a9aab5",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

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

const primaryButtonStyle = {
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

const secondaryButtonStyle = {
  background: "transparent",
  color: "#e4e5f0",
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #454850",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

export default function App() {
  const { isMobile } = useViewport();
  const [activePage, setActivePage] = useState("dashboard");
  const [authUser, setAuthUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
  };

  const refreshData = (payload) => {
    setPortalData(payload);
  };

  const handleLogout = () => {
    api.logout();
    setAuthUser(null);
    setPortalData(null);
    setActivePage("dashboard");
    setError("");
  };

  const loadPortal = async () => {
    setLoading(true);
    try {
      const payload = await api.bootstrap();
      setPortalData(payload);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to restore an existing session. If token is missing or expired, clear it.
    const token = api.getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    api
      .getMe()
      .then(({ resident }) => {
        setAuthUser(resident);
      })
      .catch(() => {
        api.clearToken();
      })
      .finally(() => setAuthChecking(false));
  }, []);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    loadPortal();
  }, [authUser]);

  useEffect(() => {
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (!event.target.closest("[data-notif-panel]")) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (authChecking) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", color: "#e4e5f0" }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="sync" style={{ fontSize: 42, color: "#c7bfff", animation: "spin 1.1s linear infinite" }} />
            <p style={{ marginTop: 12, color: "#a9aab5" }}>Loading SocietyConnect...</p>
          </div>
        </div>
      </>
    );
  }

  if (!authUser) {
    return (
      <>
        <GlobalStyles />
        <LoginPage
          onLogin={(user, role) => {
            if (role === "admin") {
              // Admin logged in — redirect to the admin portal
              window.location.href = "/admin";
            } else {
              setAuthUser(user);
            }
          }}
        />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", color: "#e4e5f0" }}>
          <div style={{ textAlign: "center" }}>
            <Icon name="sync" style={{ fontSize: 42, color: "#c7bfff", animation: "spin 1.1s linear infinite" }} />
            <p style={{ marginTop: 12, color: "#a9aab5" }}>Loading SocietyConnect...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !portalData) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", color: "#e4e5f0", padding: 24 }}>
          <div style={{ background: "#17191f", border: "1px solid #454850", borderRadius: 16, padding: 32, maxWidth: 480, textAlign: "center" }}>
            <Icon name="error" style={{ fontSize: 40, color: "#fa746f" }} />
            <h2 style={{ margin: "12px 0 6px", color: "#e4e5f0" }}>Unable to load the portal</h2>
            <p style={{ margin: "0 0 20px", color: "#a9aab5" }}>{error || "Unknown error"}</p>
            <button
              onClick={() => { setError(""); loadPortal(); }}
              style={{ background: "#c7bfff", color: "#3d3092", padding: "10px 24px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  const pageNames = {
    dashboard: "Dashboard",
    complaints: "Complaints",
    payments: "Payments",
    history: "History",
    schedule: "Schedule",
    help: "Help Center",
    settings: "Settings",
  };

  const unreadNotifications = portalData.notifications.filter((item) => !item.read).length;
  const markAllRead = () => {
    setPortalData((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    }));
  };

  const actionHandlers = {
    createComplaint: async (body) => refreshData(await api.createComplaint(body)),
    resolveComplaint: async (complaintId) => refreshData(await api.resolveComplaint(complaintId)),
    createBooking: async (body) => refreshData(await api.createBooking(body)),
    saveProfile: async (body) => refreshData(await api.saveProfile(body)),
    savePreferences: async (body) => refreshData(await api.savePreferences(body)),
  };

  return (
    <>
      <GlobalStyles />

      <div style={{ display: "flex", minHeight: "100vh", background: "#0d0e12" }}>
        <Sidebar
          active={activePage}
          setActive={setActivePage}
          resident={portalData.resident}
          isMobile={isMobile}
          unreadCount={unreadNotifications}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onLogout={handleLogout}
        />

        <div style={{ marginLeft: isMobile ? 0 : 256, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <div data-notif-panel>
            <Header
              page={pageNames[activePage] || activePage}
              notifications={portalData.notifications}
              showNotifPanel={showNotifPanel}
              setShowNotifPanel={setShowNotifPanel}
              markAllRead={markAllRead}
              resident={portalData.resident}
              isMobile={isMobile}
              setMobileOpen={setMobileOpen}
            />
          </div>

          <div style={{ flex: 1 }}>
            {activePage === "dashboard" && (
              <Dashboard
                complaints={portalData.complaints}
                bills={portalData.bills}
                history={portalData.history}
                setActivePage={setActivePage}
                scheduleEvents={portalData.scheduleEvents}
                isMobile={isMobile}
                resident={portalData.resident}
              />
            )}
            {activePage === "complaints" && (
              <ComplaintsPage
                complaints={portalData.complaints}
                onCreateComplaint={actionHandlers.createComplaint}
                onResolveComplaint={actionHandlers.resolveComplaint}
                addToast={addToast}
                isMobile={isMobile}
              />
            )}
            {activePage === "payments" && (
              <PaymentsPage
                bills={portalData.bills}
                paymentGateway={portalData.paymentGateway}
                resident={portalData.resident}
                refreshData={refreshData}
                addToast={addToast}
                isMobile={isMobile}
              />
            )}
            {activePage === "history" && (
              <HistoryPage
                history={portalData.history}
                complaints={portalData.complaints}
                bills={portalData.bills}
                scheduleEvents={portalData.scheduleEvents}
                addToast={addToast}
                isMobile={isMobile}
              />
            )}
            {activePage === "schedule" && (
              <SchedulePage
                scheduleEvents={portalData.scheduleEvents}
                bookings={portalData.bookings}
                onCreateBooking={actionHandlers.createBooking}
                addToast={addToast}
                isMobile={isMobile}
              />
            )}
            {activePage === "help" && <HelpPage faqs={portalData.faqs} addToast={addToast} isMobile={isMobile} />}
            {activePage === "settings" && (
              <SettingsPage
                resident={portalData.resident}
                onSaveProfile={actionHandlers.saveProfile}
                onSavePreferences={actionHandlers.savePreferences}
                addToast={addToast}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={(id) => setToasts((current) => current.filter((item) => item.id !== id))} />
    </>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

      * {
        box-sizing: border-box;
        font-family: 'Inter', sans-serif;
      }

      body {
        margin: 0;
        background: #0d0e12;
        color: #e4e5f0;
      }

      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      a {
        color: inherit;
      }

      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: #454850;
        border-radius: 999px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      select option {
        background: #17191f;
        color: #e4e5f0;
      }
    `}</style>
  );
}

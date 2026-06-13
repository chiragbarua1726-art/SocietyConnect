import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { adminApi } from "./adminApi.js";

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

// Google "G" SVG logo — used in custom button
function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function loadGoogleScript() {
  if (document.getElementById("google-gsi")) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-gsi";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(script);
  });
}

const inputStyle = {
  width: "100%",
  background: "#111318",
  border: "1px solid #454850",
  borderRadius: 8,
  padding: "12px 14px",
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

// ── Google button (custom-styled, dark-theme) ─────────────────────────────────

function GoogleSignInButton({ authConfig, onSuccess, onError }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const promiseRef = useRef(null);

  useEffect(() => {
    if (!authConfig.googleEnabled || !authConfig.googleClientId) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: authConfig.googleClientId,
          callback: async (response) => {
            setLoading(true);
            try {
              await onSuccess(response.credential);
            } catch (e) {
              onError(e.message);
            } finally {
              setLoading(false);
            }
          },
          // Don't show One Tap prompt — we control the button ourselves
          auto_select: false,
        });
        if (!cancelled) setReady(true);
      })
      .catch((e) => { if (!cancelled) onError(e.message); });

    return () => { cancelled = true; };
  }, [authConfig]);

  const handleClick = () => {
    if (!ready || loading) return;
    // Trigger the Google account chooser popup
    window.google.accounts.id.prompt();
  };

  if (!authConfig.googleEnabled) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready || loading}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "11px 16px",
        background: loading || !ready ? "#1a1c24" : "#23262e",
        border: "1px solid #454850",
        borderRadius: 10,
        color: "#e4e5f0",
        fontSize: 14,
        fontWeight: 600,
        cursor: loading || !ready ? "not-allowed" : "pointer",
        transition: "background 0.15s, border-color 0.15s",
        opacity: !ready ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (ready && !loading) e.currentTarget.style.borderColor = "#6b6f7e"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#454850"; }}
    >
      {loading ? (
        <Icon name="sync" style={{ fontSize: 18, color: "#a9aab5", animation: "spin 1s linear infinite" }} />
      ) : (
        <GoogleLogo size={18} />
      )}
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "#2a2d35" }} />
      <span style={{ fontSize: 11, color: "#555866", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        or
      </span>
      <div style={{ flex: 1, height: 1, background: "#2a2d35" }} />
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ErrorBox({ message }) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "10px 12px",
        borderRadius: 8,
        background: "rgba(135,31,33,0.3)",
        border: "1px solid rgba(250,116,111,0.3)",
        color: "#ff9993",
        fontSize: 13,
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <Icon name="error" style={{ fontSize: 18 }} />
      {message}
    </div>
  );
}

function SubmitButton({ submitting, label }) {
  return (
    <button
      type="submit"
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
      <Icon
        name={submitting ? "sync" : "login"}
        style={{ fontSize: 20, animation: submitting ? "spin 1s linear infinite" : "none", color: "#3d3092" }}
      />
      {submitting ? "Signing in…" : label}
    </button>
  );
}

// ── Resident tab ──────────────────────────────────────────────────────────────

function ResidentLogin({ onLogin }) {
  const [email, setEmail] = useState("alex.johnson@email.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authConfig, setAuthConfig] = useState({ googleEnabled: false, googleClientId: null });

  useEffect(() => {
    api.getAuthConfig().then(setAuthConfig).catch(() => {});
  }, []);

  const handleGoogleSuccess = async (credential) => {
    const result = await api.loginWithGoogle({ credential });
    api.setToken(result.token);
    onLogin(result.resident, "resident");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await api.login({ email, password });
      api.setToken(result.token);
      onLogin(result.resident, "resident");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Google button — only renders when GOOGLE_CLIENT_ID is configured */}
      <GoogleSignInButton
        authConfig={authConfig}
        onSuccess={handleGoogleSuccess}
        onError={setError}
      />

      {authConfig.googleEnabled && <Divider />}

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={inputStyle}
        />
      </div>

      {error && <ErrorBox message={error} />}

      <SubmitButton submitting={submitting} label="Sign In" />

      <p style={{ margin: "18px 0 0", fontSize: 12, color: "#73757f", textAlign: "center", lineHeight: 1.5 }}>
        Demo: <span style={{ color: "#a9aab5" }}>alex.johnson@email.com</span> /{" "}
        <span style={{ color: "#a9aab5" }}>resident123</span>
      </p>
    </form>
  );
}

// ── Admin tab ─────────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("admin@society.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await adminApi.login({ email, password });
      adminApi.setAdminToken(result.token);
      onLogin(result.admin, "admin");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Admin shield icon row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(199,191,255,0.05)", borderRadius: 10, border: "1px solid rgba(199,191,255,0.1)", marginBottom: 20 }}>
        <Icon name="admin_panel_settings" style={{ color: "#c7bfff", fontSize: 22 }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e4e5f0" }}>Admin access only</p>
          <p style={{ margin: 0, fontSize: 11, color: "#73757f" }}>Use your society admin credentials</p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Admin Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          required
          style={inputStyle}
        />
      </div>

      {error && <ErrorBox message={error} />}

      <SubmitButton submitting={submitting} label="Sign In as Admin" />

      <p style={{ margin: "18px 0 0", fontSize: 12, color: "#73757f", textAlign: "center", lineHeight: 1.5 }}>
        Demo: <span style={{ color: "#a9aab5" }}>admin@society.com</span> /{" "}
        <span style={{ color: "#a9aab5" }}>admin123</span>
      </p>
    </form>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────

function RegisterPage({ onBack }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", unit: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.register({ name: form.name, email: form.email, phone: form.phone, unit: form.unit, password: form.password });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        {/* Back button */}
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#a9aab5", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}
        >
          <Icon name="arrow_back" style={{ fontSize: 18 }} />
          Back to sign in
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, background: "rgba(199,191,255,0.1)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", border: "1px solid rgba(199,191,255,0.15)" }}>
            <Icon name="person_add" style={{ color: "#c7bfff", fontSize: 28 }} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700, color: "#c7bfff" }}>Create Account</h1>
          <p style={{ margin: 0, color: "#a9aab5", fontSize: 13 }}>
            Register as a new resident. Your account will be reviewed by the admin before you can sign in.
          </p>
        </div>

        <div style={{ background: "#17191f", border: "1px solid #454850", borderRadius: 16, padding: 28 }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 60, height: 60, background: "rgba(199,191,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <Icon name="check_circle" style={{ color: "#c7bfff", fontSize: 34 }} />
              </div>
              <h2 style={{ margin: "0 0 10px", color: "#e4e5f0", fontSize: 20, fontWeight: 700 }}>Registration Submitted!</h2>
              <p style={{ margin: "0 0 24px", color: "#a9aab5", fontSize: 14, lineHeight: 1.6 }}>
                Your account is pending admin approval. You'll be able to sign in once the society admin approves your registration.
              </p>
              <button
                onClick={onBack}
                style={{ background: "#c7bfff", color: "#3d3092", padding: "11px 28px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.name} onChange={set("name")} placeholder="Alex Johnson" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unit / Flat *</label>
                  <input value={form.unit} onChange={set("unit")} placeholder="Block A - 402" required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email Address *</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" required style={inputStyle} />
                </div>
              </div>

              {/* Pending approval notice */}
              <div style={{ display: "flex", gap: 10, padding: "10px 12px", background: "rgba(199,191,255,0.05)", border: "1px solid rgba(199,191,255,0.12)", borderRadius: 8, marginBottom: 18 }}>
                <Icon name="info" style={{ color: "#c7bfff", fontSize: 18, flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#a9aab5", lineHeight: 1.5 }}>
                  After registering, an admin must approve your account before you can sign in.
                </p>
              </div>

              {error && <ErrorBox message={error} />}

              <SubmitButton submitting={submitting} label="Create Account" />
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Unified LoginPage ─────────────────────────────────────────────────────────

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("resident");
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterPage onBack={() => setShowRegister(false)} />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0d0e12", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "rgba(199,191,255,0.1)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "1px solid rgba(199,191,255,0.15)",
            }}
          >
            <Icon name="apartment" style={{ color: "#c7bfff", fontSize: 30 }} />
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700, color: "#c7bfff" }}>
            SocietyConnect
          </h1>
          <p style={{ margin: 0, color: "#a9aab5", fontSize: 14 }}>
            Sign in to access your portal
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "#111318",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            border: "1px solid rgba(69,72,80,0.5)",
          }}
        >
          {[
            { id: "resident", icon: "person", label: "Resident" },
            { id: "admin", icon: "admin_panel_settings", label: "Admin" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                background: tab === t.id ? "#17191f" : "transparent",
                color: tab === t.id ? "#c7bfff" : "#a9aab5",
                fontWeight: tab === t.id ? 700 : 500,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s ease",
                boxShadow: tab === t.id ? "0 1px 6px rgba(0,0,0,0.4)" : "none",
              }}
            >
              <Icon name={t.icon} style={{ fontSize: 18, color: tab === t.id ? "#c7bfff" : "#a9aab5" }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "#17191f", border: "1px solid #454850", borderRadius: 16, padding: 28 }}>
          {tab === "resident" ? (
            <ResidentLogin onLogin={onLogin} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )}
        </div>

        {/* Register link — only on resident tab */}
        {tab === "resident" && (
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#73757f" }}>
            New resident?{" "}
            <button
              onClick={() => setShowRegister(true)}
              style={{ background: "none", border: "none", color: "#c7bfff", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: 0 }}
            >
              Register here
            </button>
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "sc_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401 && token) {
    clearToken();
    window.dispatchEvent(new Event("auth:logout"));
  }

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getToken,
  setToken,
  clearToken,
  getAuthConfig: () => request("/auth/config"),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  loginWithGoogle: (body) => request("/auth/google", { method: "POST", body: JSON.stringify(body) }),
  getMe: () => request("/auth/me"),
  logout: () => {
    clearToken();
    window.dispatchEvent(new Event("auth:logout"));
  },
  bootstrap: () => request("/bootstrap"),
  createComplaint: (body) => request("/complaints", { method: "POST", body: JSON.stringify(body) }),
  resolveComplaint: (complaintId) => request(`/complaints/${complaintId}/resolve`, { method: "PATCH" }),
  createBooking: (body) => request("/bookings", { method: "POST", body: JSON.stringify(body) }),
  saveProfile: (body) => request("/profile", { method: "PUT", body: JSON.stringify(body) }),
  savePreferences: (body) => request("/preferences", { method: "PUT", body: JSON.stringify(body) }),
  sendHelpMessage: (body) => request("/help/chat", { method: "POST", body: JSON.stringify(body) }),
  sendFeedback: (body) => request("/feedback", { method: "POST", body: JSON.stringify(body) }),
  createPaymentOrder: (body) => request("/payments/create-order", { method: "POST", body: JSON.stringify(body) }),
  completeDemoPayment: (body) => request("/payments/demo-complete", { method: "POST", body: JSON.stringify(body) }),
  verifyPayment: (body) => request("/payments/verify", { method: "POST", body: JSON.stringify(body) }),
};

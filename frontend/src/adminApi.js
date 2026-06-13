const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const ADMIN_TOKEN_KEY = "sc_admin_token";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401 && token) {
    clearAdminToken();
    window.dispatchEvent(new Event("admin:logout"));
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

export const adminApi = {
  getAdminToken,
  setAdminToken,
  clearAdminToken,

  login: (body) => request("/admin/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => {
    clearAdminToken();
    window.dispatchEvent(new Event("admin:logout"));
  },

  bootstrap: () => request("/admin/bootstrap"),

  // Residents
  listResidents: () => request("/admin/residents"),
  updateResidentStatus: (residentId, body) =>
    request(`/admin/residents/${residentId}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteResident: (residentId) => request(`/admin/residents/${residentId}`, { method: "DELETE" }),
  addResidentBill: (residentId, body) =>
    request(`/admin/residents/${residentId}/bills`, { method: "POST", body: JSON.stringify(body) }),
  deleteResidentBill: (residentId, billId) =>
    request(`/admin/residents/${residentId}/bills/${billId}`, { method: "DELETE" }),

  // Complaints
  assignComplaint: (complaintId, body) =>
    request(`/admin/complaints/${complaintId}/assign`, { method: "PATCH", body: JSON.stringify(body) }),

  // Bills
  addBill: (body) => request("/admin/bills", { method: "POST", body: JSON.stringify(body) }),
  deleteBill: (billId) => request(`/admin/bills/${billId}`, { method: "DELETE" }),

  // Bookings
  updateBooking: (bookingId, body) =>
    request(`/admin/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify(body) }),

  // Schedule
  addEvent: (body) => request("/admin/schedule", { method: "POST", body: JSON.stringify(body) }),
  deleteEvent: (eventId) => request(`/admin/schedule/${eventId}`, { method: "DELETE" }),

  // FAQs
  addFaq: (body) => request("/admin/faqs", { method: "POST", body: JSON.stringify(body) }),
  deleteFaq: (index) => request(`/admin/faqs/${index}`, { method: "DELETE" }),

  // Notifications
  sendNotification: (body) => request("/admin/notify", { method: "POST", body: JSON.stringify(body) }),
};

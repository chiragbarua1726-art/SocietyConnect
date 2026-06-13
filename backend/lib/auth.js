import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export function isGoogleConfigured() {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function getGoogleClientId() {
  return GOOGLE_CLIENT_ID;
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, unit: user.unit, role: user.role || "resident" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const user = verifyToken(header.slice(7));
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export async function verifyGoogleCredential(credential) {
  if (!googleClient) {
    throw new Error("Google login is not configured on the server.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account did not return an email address.");
  }

  return payload;
}

export async function verifyPassword(plain, hash) {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export function sanitizeResident(resident) {
  const { passwordHash, googleId, ...safe } = resident;
  return safe;
}

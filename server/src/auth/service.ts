import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";

const scrypt = promisify(scryptCallback);

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const SESSION_TOKEN_BYTES = 32;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

type PublicUser = {
  id: string;
  username: string;
};

type AuthSuccess = {
  ok: true;
  user: PublicUser;
  sessionId: string;
  sessionToken: string;
};

type AuthFailure = {
  ok: false;
  error: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

export type SessionUser = {
  sessionId: string;
  user: PublicUser;
};

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function validateUsername(username: string): string | null {
  const trimmedUsername = username.trim();
  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    return "Username must be 3-20 characters and use only letters, numbers, or underscores";
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }

  return null;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_BYTES) as Buffer;
  return `${salt.toString("base64url")}:${derivedKey.toString("base64url")}`;
}

async function verifyPassword(
  password: string,
  storedPasswordHash: string,
): Promise<boolean> {
  const [saltBase64Url, storedKeyBase64Url] = storedPasswordHash.split(":");
  if (!saltBase64Url || !storedKeyBase64Url) {
    return false;
  }

  const salt = Buffer.from(saltBase64Url, "base64url");
  const storedKey = Buffer.from(storedKeyBase64Url, "base64url");
  const derivedKey = await scrypt(password, salt, storedKey.length) as Buffer;

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
}

function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

function hashSessionToken(sessionToken: string): string {
  return createHash("sha256").update(sessionToken).digest("base64url");
}

function createSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function createSession(user: PublicUser): Promise<{
  id: string;
  token: string;
}> {
  const sessionToken = createSessionToken();
  const tokenHash = hashSessionToken(sessionToken);
  const [session] = await db
    .insert(sessions)
    .values({
      userId: user.id,
      tokenHash,
      expiresAt: createSessionExpiryDate(),
      lastUsedAt: new Date(),
    })
    .returning({ id: sessions.id });

  return {
    id: session.id,
    token: sessionToken,
  };
}

export async function signUpWithPassword(input: {
  username: string;
  password: string;
  passwordConfirmation?: string;
}): Promise<AuthResult> {
  const usernameError = validateUsername(input.username);
  if (usernameError) {
    return { ok: false, error: usernameError };
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  if (
    input.passwordConfirmation !== undefined &&
    input.password !== input.passwordConfirmation
  ) {
    return { ok: false, error: "Passwords do not match" };
  }

  const trimmedUsername = input.username.trim();
  const normalizedUsername = normalizeUsername(trimmedUsername);
  const passwordHash = await hashPassword(input.password);

  try {
    const [user] = await db
      .insert(users)
      .values({
        username: trimmedUsername,
        usernameNormalized: normalizedUsername,
        passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
      });

    const session = await createSession(user);

    return {
      ok: true,
      user,
      sessionId: session.id,
      sessionToken: session.token,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Username is already taken" };
    }

    throw error;
  }
}

export async function logInWithPassword(input: {
  username: string;
  password: string;
}): Promise<AuthResult> {
  const normalizedUsername = normalizeUsername(input.username);

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.usernameNormalized, normalizedUsername))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Invalid username or password" };
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    return { ok: false, error: "Invalid username or password" };
  }

  const publicUser = { id: user.id, username: user.username };
  const session = await createSession(publicUser);

  return {
    ok: true,
    user: publicUser,
    sessionId: session.id,
    sessionToken: session.token,
  };
}

export async function getSessionUserByToken(
  sessionToken: string,
): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(sessionToken);
  const now = new Date();

  const [session] = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      username: users.username,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
      ),
    )
    .limit(1);

  if (!session) {
    return null;
  }

  await db
    .update(sessions)
    .set({ lastUsedAt: now })
    .where(eq(sessions.id, session.sessionId));

  return {
    sessionId: session.sessionId,
    user: {
      id: session.userId,
      username: session.username,
    },
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

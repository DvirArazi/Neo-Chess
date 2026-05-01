import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt, isNull, or } from "drizzle-orm";
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
const GOOGLE_USERNAME_FALLBACK = "player";
const MAX_GOOGLE_USERNAME_SUFFIX = 999;

type PublicUser = {
  id: string;
  username: string;
  elo: number;
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

function normalizeGoogleUsernameSource(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function buildGoogleUsernameBase(input: {
  email?: string | null;
  googleSubject?: string;
  name?: string | null;
}): string {
  const candidateSources = [
    input.name ?? "",
    input.email?.split("@")[0] ?? "",
    input.googleSubject ?? "",
    GOOGLE_USERNAME_FALLBACK,
  ];

  for (const source of candidateSources) {
    const candidate = normalizeGoogleUsernameSource(source);
    if (candidate.length > 0) {
      return candidate;
    }
  }

  return GOOGLE_USERNAME_FALLBACK;
}

function buildGoogleUsernameCandidate(base: string, duplicateIndex: number): string {
  if (duplicateIndex === 0) {
    return base;
  }

  return `${base} ${duplicateIndex + 1}`;
}

async function findAvailableGoogleUsername(
  baseUsername: string,
  excludeUserId?: string,
): Promise<{
  username: string;
  usernameNormalized: string;
}> {
  for (
    let duplicateIndex = 0;
    duplicateIndex <= MAX_GOOGLE_USERNAME_SUFFIX;
    duplicateIndex += 1
  ) {
    const candidateUsername = buildGoogleUsernameCandidate(
      baseUsername,
      duplicateIndex,
    );
    const candidateNormalized = normalizeUsername(candidateUsername);
    const [conflictingUser] = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        or(
          eq(users.usernameNormalized, candidateNormalized),
          eq(users.username, candidateUsername),
        ),
      )
      .limit(1);

    if (!conflictingUser || conflictingUser.id === excludeUserId) {
      return {
        username: candidateUsername,
        usernameNormalized: candidateNormalized,
      };
    }
  }

  throw new Error("Unable to allocate a unique username for Google sign-in");
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
  let currentError: unknown = error;

  while (typeof currentError === "object" && currentError !== null) {
    if ("code" in currentError && currentError.code === "23505") {
      return true;
    }

    if (!("cause" in currentError)) {
      break;
    }

    currentError = currentError.cause;
  }

  return false;
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

async function createAuthResultForUser(user: PublicUser): Promise<AuthSuccess> {
  const session = await createSession(user);

  return {
    ok: true,
    user,
    sessionId: session.id,
    sessionToken: session.token,
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
        elo: users.elo,
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
      elo: users.elo,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.usernameNormalized, normalizedUsername))
    .limit(1);

  if (!user) {
    return { ok: false, error: "Invalid username or password" };
  }

  if (!user.passwordHash) {
    return { ok: false, error: "Invalid username or password" };
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    return { ok: false, error: "Invalid username or password" };
  }

  const publicUser = { id: user.id, username: user.username, elo: user.elo };
  return createAuthResultForUser(publicUser);
}

export async function logInWithGoogleProfile(input: {
  googleSubject: string;
  email?: string | null;
  emailVerified: boolean;
  name?: string | null;
}): Promise<AuthResult> {
  if (!input.emailVerified) {
    return { ok: false, error: "Google account email is not verified" };
  }

  const usernameBase = buildGoogleUsernameBase(input);

  const [existingUser] = await db
    .select({
      id: users.id,
      username: users.username,
      usernameNormalized: users.usernameNormalized,
      elo: users.elo,
    })
    .from(users)
    .where(eq(users.googleSubject, input.googleSubject))
    .limit(1);

  for (let attempt = 0; attempt <= MAX_GOOGLE_USERNAME_SUFFIX; attempt += 1) {
    const candidateUser = await findAvailableGoogleUsername(
      usernameBase,
      existingUser?.id,
    );

    try {
      if (existingUser) {
        if (
          existingUser.username === candidateUser.username &&
          existingUser.usernameNormalized === candidateUser.usernameNormalized
        ) {
          return createAuthResultForUser({
            id: existingUser.id,
            username: existingUser.username,
            elo: existingUser.elo,
          });
        }

        const [updatedUser] = await db
          .update(users)
          .set({
            username: candidateUser.username,
            usernameNormalized: candidateUser.usernameNormalized,
          })
          .where(eq(users.id, existingUser.id))
          .returning({
            id: users.id,
            username: users.username,
            elo: users.elo,
          });

        if (!updatedUser) {
          throw new Error("Google user update did not return a row");
        }

        return createAuthResultForUser(updatedUser);
      }

      const [createdUser] = await db
        .insert(users)
        .values({
          username: candidateUser.username,
          usernameNormalized: candidateUser.usernameNormalized,
          passwordHash: null,
          googleSubject: input.googleSubject,
        })
        .returning({
          id: users.id,
          username: users.username,
          elo: users.elo,
        });

      return createAuthResultForUser(createdUser);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const [concurrentUser] = await db
        .select({
          id: users.id,
          username: users.username,
          elo: users.elo,
        })
        .from(users)
        .where(eq(users.googleSubject, input.googleSubject))
        .limit(1);

      if (concurrentUser) {
        return createAuthResultForUser(concurrentUser);
      }
    }
  }

  throw new Error("Unable to allocate a unique username for Google sign-in");
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
      elo: users.elo,
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
      elo: session.elo,
    },
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

import { and, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { friendRequests, friendships, users } from "../db/schema.js";
import { normalizeUsername } from "../auth/service.js";
import type { FriendEntry, FriendRequest } from "../../../shared/socket.js";

const USER_SEARCH_LIMIT = 30;

function getFriendshipPair(userId: string, otherUserId: string): {
  userAId: string;
  userBId: string;
} {
  return userId < otherUserId
    ? { userAId: userId, userBId: otherUserId }
    : { userAId: otherUserId, userBId: userId };
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

async function getFriendIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      userAId: friendships.userAId,
      userBId: friendships.userBId,
    })
    .from(friendships)
    .where(
      or(
        eq(friendships.userAId, userId),
        eq(friendships.userBId, userId),
      ),
    );

  return new Set(
    rows.map((row) => row.userAId === userId ? row.userBId : row.userAId),
  );
}

async function getOutgoingRequestRecipientIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      recipientId: friendRequests.recipientId,
    })
    .from(friendRequests)
    .where(eq(friendRequests.requesterId, userId));

  return new Set(rows.map((row) => row.recipientId));
}

export async function getFriendsSnapshot(input: {
  userId: string;
  search?: string;
  markRequestsSeen?: boolean;
}): Promise<{
  requests: FriendRequest[];
  users: FriendEntry[];
  hasUnseenRequests: boolean;
}> {
  const pendingRequestRows = await db
    .select({
      id: friendRequests.id,
      userId: users.id,
      username: users.username,
      isSeen: friendRequests.isSeen,
    })
    .from(friendRequests)
    .innerJoin(users, eq(users.id, friendRequests.requesterId))
    .where(eq(friendRequests.recipientId, input.userId));

  const hasUnseenRequests = pendingRequestRows.some((request) => !request.isSeen);

  if (input.markRequestsSeen && hasUnseenRequests) {
    await db
      .update(friendRequests)
      .set({ isSeen: true })
      .where(
        and(
          eq(friendRequests.recipientId, input.userId),
          eq(friendRequests.isSeen, false),
        ),
      );
  }

  const friendIds = await getFriendIds(input.userId);
  const outgoingRequestRecipientIds = await getOutgoingRequestRecipientIds(
    input.userId,
  );
  const search = input.search?.trim() ?? "";
  let userRows: Array<{ id: string; username: string }> = [];

  if (search.length === 0) {
    if (friendIds.size > 0) {
      userRows = await db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(inArray(users.id, [...friendIds]));
    }
  } else {
    const normalizedSearch = normalizeUsername(search);
    userRows = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(
        and(
          ne(users.id, input.userId),
          ilike(users.usernameNormalized, `%${normalizedSearch}%`),
        ),
      )
      .limit(USER_SEARCH_LIMIT);
  }

  return {
    requests: pendingRequestRows.map((request) => ({
      id: request.id,
      userId: request.userId,
      username: request.username,
    })),
    users: userRows
      .map((user) => ({
        id: user.id,
        username: user.username,
        isFriend: friendIds.has(user.id),
        hasPendingRequest: outgoingRequestRecipientIds.has(user.id),
      }))
      .sort((left, right) => left.username.localeCompare(right.username)),
    hasUnseenRequests: input.markRequestsSeen ? false : hasUnseenRequests,
  };
}

export async function sendFriendRequest(input: {
  requesterId: string;
  recipientId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (input.requesterId === input.recipientId) {
    return { ok: false, error: "You cannot add yourself" };
  }

  const pair = getFriendshipPair(input.requesterId, input.recipientId);
  const [existingFriendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        eq(friendships.userAId, pair.userAId),
        eq(friendships.userBId, pair.userBId),
      ),
    )
    .limit(1);

  if (existingFriendship) {
    return { ok: false, error: "This user is already your friend" };
  }

  const [reciprocalRequest] = await db
    .select({ id: friendRequests.id })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.requesterId, input.recipientId),
        eq(friendRequests.recipientId, input.requesterId),
      ),
    )
    .limit(1);

  if (reciprocalRequest) {
    await approveFriendRequest({
      requestId: reciprocalRequest.id,
      recipientId: input.requesterId,
    });
    return { ok: true };
  }

  try {
    await db
      .insert(friendRequests)
      .values({
        requesterId: input.requesterId,
        recipientId: input.recipientId,
      });

    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Friend request already sent" };
    }

    throw error;
  }
}

export async function approveFriendRequest(input: {
  requestId: string;
  recipientId: string;
}): Promise<string | null> {
  const [request] = await db
    .select({
      requesterId: friendRequests.requesterId,
      recipientId: friendRequests.recipientId,
    })
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.id, input.requestId),
        eq(friendRequests.recipientId, input.recipientId),
      ),
    )
    .limit(1);

  if (!request) {
    return null;
  }

  const pair = getFriendshipPair(request.requesterId, request.recipientId);

  try {
    await db
      .insert(friendships)
      .values(pair);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  await db
    .delete(friendRequests)
    .where(
      or(
        and(
          eq(friendRequests.requesterId, request.requesterId),
          eq(friendRequests.recipientId, request.recipientId),
        ),
        and(
          eq(friendRequests.requesterId, request.recipientId),
          eq(friendRequests.recipientId, request.requesterId),
        ),
      ),
    );

  return request.requesterId;
}

export async function denyFriendRequest(input: {
  requestId: string;
  recipientId: string;
}): Promise<void> {
  await db
    .delete(friendRequests)
    .where(
      and(
        eq(friendRequests.id, input.requestId),
        eq(friendRequests.recipientId, input.recipientId),
      ),
    );
}

export async function unfriend(input: {
  userId: string;
  friendId: string;
}): Promise<void> {
  const pair = getFriendshipPair(input.userId, input.friendId);

  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.userAId, pair.userAId),
        eq(friendships.userBId, pair.userBId),
      ),
    );
}

import prisma from "../prisma";
import { createJWT } from "./auth";

/**
 * Create a new session for a user
 */
export const createSession = async (
  userId: number,
  userAgent?: string | null,
  ipAddress?: string | null
) => {
  // Generate access and refresh tokens
  const tokens = createJWT(userId);

  // Create a new session record
  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken: tokens.refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  return {
    session,
    tokens,
  };
};

/**
 * Invalidate a specific session
 */
export const invalidateSession = async (sessionId: string) => {
  return prisma.session.update({
    where: { id: sessionId },
    data: { isValid: false },
  });
};

/**
 * Invalidate all sessions for a user
 */
export const invalidateAllUserSessions = async (
  userId: number,
  exceptSessionId?: string
) => {
  const whereClause: any = { userId, isValid: true };

  if (exceptSessionId) {
    whereClause.id = { not: exceptSessionId };
  }

  return prisma.session.updateMany({
    where: whereClause,
    data: { isValid: false },
  });
};

/**
 * Find active sessions for a user

 */
export const getUserActiveSessions = async (userId: number) => {
  return prisma.session.findMany({
    where: {
      userId,
      isValid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Get a session by refresh token
 */
export const getSessionByToken = async (refreshToken: string) => {
  return prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });
};

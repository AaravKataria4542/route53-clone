export type MockSession = {
  user: {
    id: string;
    email: string;
  };
  createdAt: string;
};

const SESSION_KEY = "route53-clone-session";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function userIdFromEmail(email: string) {
  return `mock-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user"}`;
}

export function getMockSession(): MockSession | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MockSession;
    return parsed?.user?.email ? parsed : null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function signInMock(email: string): MockSession {
  const normalizedEmail = email.trim().toLowerCase();
  const session: MockSession = {
    user: {
      id: userIdFromEmail(normalizedEmail),
      email: normalizedEmail,
    },
    createdAt: new Date().toISOString(),
  };
  if (canUseStorage()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function signOutMock() {
  if (canUseStorage()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getCurrentMockUser() {
  return getMockSession()?.user ?? null;
}

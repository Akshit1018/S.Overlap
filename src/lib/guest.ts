const GUEST_KEY = "overlap.guest";
const CREATED_KEY = "overlap.created";
const RESPONDED_KEY = "overlap.responded";
const NAME_KEY = "overlap.name";

export function getGuestToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = window.localStorage.getItem(GUEST_KEY);
    if (!token) {
      token = crypto.randomUUID();
      window.localStorage.setItem(GUEST_KEY, token);
    }
    return token;
  } catch {
    return "anon";
  }
}

export function getSavedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setSavedName(name: string): void {
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

export type LocalEventRef = { id: string; token?: string };

function readList(key: string): LocalEventRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalEventRef[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, items: LocalEventRef[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function rememberCreated(id: string, token: string): void {
  const list = readList(CREATED_KEY).filter((item) => item.id !== id);
  list.unshift({ id, token });
  writeList(CREATED_KEY, list);
}

export function rememberResponded(id: string): void {
  const list = readList(RESPONDED_KEY).filter((item) => item.id !== id);
  list.unshift({ id });
  writeList(RESPONDED_KEY, list);
}

export function listCreated(): LocalEventRef[] {
  return readList(CREATED_KEY);
}

export function listResponded(): LocalEventRef[] {
  return readList(RESPONDED_KEY);
}

export function forgetCreated(id: string): void {
  writeList(
    CREATED_KEY,
    readList(CREATED_KEY).filter((item) => item.id !== id),
  );
}

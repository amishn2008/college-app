type PresenceEntry = {
  userId: string;
  name: string;
  color: string;
  cursor: number;
  selectionStart: number;
  selectionEnd: number;
  updatedAt: number;
};

const presenceStore = new Map<string, Map<string, PresenceEntry>>();
const PRESENCE_TTL = 15000;
const COLORS = [
  '#f97316',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#ec4899',
  '#f59e0b',
  '#0ea5e9',
];

const colorForUser = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

const getEssayMap = (essayId: string) => {
  if (!presenceStore.has(essayId)) {
    presenceStore.set(essayId, new Map());
  }
  return presenceStore.get(essayId)!;
};

const cleanupEssayPresence = (essayId: string) => {
  const now = Date.now();
  const map = presenceStore.get(essayId);
  if (!map) return;
  map.forEach((entry, key) => {
    if (now - entry.updatedAt > PRESENCE_TTL) {
      map.delete(key);
    }
  });
};

export const updateEssayPresence = (essayId: string, entry: Omit<PresenceEntry, 'updatedAt' | 'color'> & { color?: string }) => {
  const map = getEssayMap(essayId);
  map.set(entry.userId, {
    ...entry,
    color: entry.color || colorForUser(entry.userId),
    updatedAt: Date.now(),
  });
  cleanupEssayPresence(essayId);
};

export const clearEssayPresence = (essayId: string, userId: string) => {
  const map = presenceStore.get(essayId);
  if (!map) return;
  map.delete(userId);
};

export const listEssayPresence = (essayId: string, excludeUserId?: string) => {
  cleanupEssayPresence(essayId);
  const map = presenceStore.get(essayId);
  if (!map) return [];
  return Array.from(map.values())
    .filter((entry) => (excludeUserId ? entry.userId !== excludeUserId : true))
    .map((entry) => ({
      ...entry,
      updatedAt: new Date(entry.updatedAt).toISOString(),
    }));
};

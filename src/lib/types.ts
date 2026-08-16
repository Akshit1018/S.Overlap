export type SlotMark = "available" | "if_needed";

export type SlotsMap = Record<string, SlotMark>;

export type EventRecord = {
  id: string;
  ownerId: string | null;
  creatorToken: string;
  title: string;
  timezone: string;
  dates: string[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
  hideResponses: boolean;
  createdAt: string;
};

export type ResponseRecord = {
  id: string;
  eventId: string;
  userId: string | null;
  guestToken: string;
  name: string;
  hue: number;
  slots: SlotsMap;
  updatedAt: string;
};

export type EventWithResponses = EventRecord & {
  responses: ResponseRecord[];
};

export type EventSummary = EventRecord & {
  responseCount: number;
};

export type CreateEventInput = {
  title: string;
  timezone: string;
  dates: string[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
  hideResponses: boolean;
  creatorToken: string;
};

export type SaveResponseInput = {
  eventId: string;
  guestToken: string;
  name: string;
  slots: SlotsMap;
};

export type BestWindow = {
  startKey: string;
  endKey: string;
  date: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  available: number;
  ifNeeded: number;
  score: number;
  slotCount: number;
};

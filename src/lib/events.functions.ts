import { createServerFn } from "@tanstack/react-start";
import { addDays, format, startOfDay } from "date-fns";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { parseJson, shortId, hueFromString } from "@/lib/utils";
import type {
  CreateEventInput,
  EventRecord,
  EventSummary,
  EventWithResponses,
  ResponseRecord,
  SaveResponseInput,
  SlotsMap,
} from "@/lib/types";

type EventRow = {
  id: string;
  owner_id: string | null;
  creator_token: string;
  title: string;
  timezone: string;
  dates: string;
  start_hour: number;
  end_hour: number;
  slot_minutes: number;
  hide_responses: boolean;
  created_at: string;
};

type ResponseRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_token: string;
  name: string;
  hue: number;
  slots: string;
  updated_at: string;
};

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    creatorToken: row.creator_token,
    title: row.title,
    timezone: row.timezone,
    dates: parseJson<string[]>(row.dates, []).sort(),
    startHour: Number(row.start_hour),
    endHour: Number(row.end_hour),
    slotMinutes: Number(row.slot_minutes),
    hideResponses: Boolean(row.hide_responses),
    createdAt: typeof row.created_at === "string" ? row.created_at : String(row.created_at),
  };
}

function mapResponse(row: ResponseRow): ResponseRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    guestToken: row.guest_token,
    name: row.name,
    hue: Number(row.hue),
    slots: parseJson<SlotsMap>(row.slots, {}),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : String(row.updated_at),
  };
}

function publicEvent(event: EventRecord, viewerIsOwner: boolean): EventRecord {
  if (viewerIsOwner) return event;
  return { ...event, creatorToken: "" };
}

function publicResponses(
  event: EventRecord,
  responses: ResponseRecord[],
  viewerGuest: string,
  viewerIsOwner: boolean,
): ResponseRecord[] {
  return responses.map((response) => {
    const mine = response.guestToken === viewerGuest;
    const hide = event.hideResponses && !viewerIsOwner && !mine;
    return {
      ...response,
      guestToken: mine ? response.guestToken : "",
      userId: mine ? response.userId : null,
      name: hide ? "Hidden" : response.name,
    };
  });
}

async function optionalUserId(): Promise<string | null> {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const user = await getSessionUser();
  return user?.id ?? null;
}

async function loadResponses(eventId: string): Promise<ResponseRecord[]> {
  const sql = await getSql();
  const rows = await sql<ResponseRow>`
    select id, event_id, user_id, guest_token, name, hue, slots, updated_at
    from responses
    where event_id = ${eventId}
    order by updated_at asc
  `;
  return rows.map(mapResponse);
}

function nextWeekdays(count = 5): string[] {
  const dates: string[] = [];
  let cursor = startOfDay(new Date());
  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function demoSlots(name: string, dates: string[]): SlotsMap {
  const slots: SlotsMap = {};
  const patterns: Record<string, { start: number; end: number; extra?: [number, number] }[]> = {
    Maya: [{ start: 9, end: 12 }, { start: 14, end: 16 }],
    Jordan: [{ start: 10, end: 15 }],
    Priya: [{ start: 9, end: 13 }],
    Alex: [{ start: 11, end: 15 }],
    Sam: [{ start: 9, end: 11 }, { start: 13, end: 16 }],
  };
  const blocks = patterns[name] ?? [{ start: 10, end: 12 }];
  for (const date of dates) {
    const skipFriAfternoon = name === "Jordan" && date === dates[dates.length - 1];
    for (const block of blocks) {
      if (skipFriAfternoon && block.start >= 13) continue;
      for (let hour = block.start; hour < block.end; hour += 1) {
        slots[`${date}T${String(hour).padStart(2, "0")}:00`] = "available";
        slots[`${date}T${String(hour).padStart(2, "0")}:30`] = "available";
      }
    }
    if (name === "Priya" && dates.indexOf(date) === 2) {
      slots[`${date}T13:00`] = "if_needed";
      slots[`${date}T13:30`] = "if_needed";
    }
  }
  return slots;
}

async function ensureDemo(): Promise<void> {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`select id from events where id = ${"demo"}`;
  if (existing.length > 0) return;

  const dates = nextWeekdays(5);
  await sql`
    insert into events (
      id, owner_id, creator_token, title, timezone, dates,
      start_hour, end_hour, slot_minutes, hide_responses
    ) values (
      ${"demo"}, ${null}, ${"demo-owner"}, ${"Product offsite"}, ${"Asia/Kolkata"},
      ${JSON.stringify(dates)}, ${9}, ${17}, ${30}, ${false}
    )
  `;

  const people = ["Maya", "Jordan", "Priya", "Alex", "Sam"];
  for (const name of people) {
    await sql`
      insert into responses (id, event_id, user_id, guest_token, name, hue, slots)
      values (
        ${`demo-${name.toLowerCase()}`},
        ${"demo"},
        ${null},
        ${`demo-${name.toLowerCase()}`},
        ${name},
        ${hueFromString(name)},
        ${JSON.stringify(demoSlots(name, dates))}
      )
    `;
  }
}

export const getEvent = createServerFn({ method: "GET" })
  .validator((input: { id: string; guestToken?: string }) => input)
  .handler(async ({ data }) => {
    await ensureDemo();
    const sql = await getSql();
    const rows = await sql<EventRow>`
      select id, owner_id, creator_token, title, timezone, dates,
             start_hour, end_hour, slot_minutes, hide_responses, created_at
      from events where id = ${data.id}
    `;
    const row = rows[0];
    if (!row) return null;
    const userId = await optionalUserId();
    const event = mapEvent(row);
    const viewerIsOwner =
      (userId != null && event.ownerId === userId) ||
      (data.guestToken != null && data.guestToken === event.creatorToken);
    const responses = await loadResponses(event.id);
    const payload: EventWithResponses = {
      ...publicEvent(event, viewerIsOwner),
      responses: publicResponses(event, responses, data.guestToken ?? "", viewerIsOwner),
    };
    return payload;
  });

export const createEvent = createServerFn({ method: "POST" })
  .validator((input: CreateEventInput) => {
    const title = input.title.trim().slice(0, 80);
    const dates = [...new Set(input.dates)].sort();
    if (dates.length === 0) throw new Error("Pick at least one day");
    if (input.endHour <= input.startHour) throw new Error("End time must be after start");
    return {
      ...input,
      title: title || "New meeting",
      dates,
      startHour: Math.max(0, Math.min(23, input.startHour)),
      endHour: Math.max(1, Math.min(24, input.endHour)),
      slotMinutes: input.slotMinutes === 60 ? 60 : 30,
    };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = shortId(10);
    const userId = await optionalUserId();
    await sql`
      insert into events (
        id, owner_id, creator_token, title, timezone, dates,
        start_hour, end_hour, slot_minutes, hide_responses
      ) values (
        ${id},
        ${userId},
        ${data.creatorToken},
        ${data.title},
        ${data.timezone},
        ${JSON.stringify(data.dates)},
        ${data.startHour},
        ${data.endHour},
        ${data.slotMinutes},
        ${data.hideResponses}
      )
    `;
    return { id, creatorToken: data.creatorToken };
  });

export const saveResponse = createServerFn({ method: "POST" })
  .validator((input: SaveResponseInput) => {
    const name = input.name.trim().slice(0, 40);
    if (!name) throw new Error("Add your name");
    if (!input.guestToken) throw new Error("Missing guest token");
    return { ...input, name };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const events = await sql<{ id: string }>`select id from events where id = ${data.eventId}`;
    if (events.length === 0) throw new Error("Poll not found");
    const userId = await optionalUserId();
    const existing = await sql<{ id: string }>`
      select id from responses
      where event_id = ${data.eventId} and guest_token = ${data.guestToken}
    `;
    const hue = hueFromString(data.name);
    const slots = JSON.stringify(data.slots);
    if (existing[0]) {
      await sql`
        update responses
        set name = ${data.name},
            hue = ${hue},
            slots = ${slots},
            user_id = ${userId},
            updated_at = now()
        where id = ${existing[0].id}
      `;
      return { id: existing[0].id };
    }
    const id = shortId(12);
    await sql`
      insert into responses (id, event_id, user_id, guest_token, name, hue, slots)
      values (${id}, ${data.eventId}, ${userId}, ${data.guestToken}, ${data.name}, ${hue}, ${slots})
    `;
    return { id };
  });

export const listMyEvents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureDemo();
    const sql = await getSql();
    const rows = await sql<EventRow & { response_count: number }>`
      select e.id, e.owner_id, e.creator_token, e.title, e.timezone, e.dates,
             e.start_hour, e.end_hour, e.slot_minutes, e.hide_responses, e.created_at,
             (select count(*) from responses r where r.event_id = e.id) as response_count
      from events e
      where e.owner_id = ${context.userId}
      order by e.created_at desc
    `;
    return rows.map((row) => ({
      ...publicEvent(mapEvent(row), true),
      responseCount: Number(row.response_count),
    })) satisfies EventSummary[];
  });

export const getEventsByIds = createServerFn({ method: "GET" })
  .validator((input: { ids: string[] }) => ({
    ids: input.ids.filter(Boolean).slice(0, 40),
  }))
  .handler(async ({ data }) => {
    await ensureDemo();
    if (data.ids.length === 0) return [] as EventSummary[];
    const sql = await getSql();
    const collected: (EventRow & { response_count: number })[] = [];
    for (const id of data.ids) {
      const rows = await sql<EventRow & { response_count: number }>`
        select e.id, e.owner_id, e.creator_token, e.title, e.timezone, e.dates,
               e.start_hour, e.end_hour, e.slot_minutes, e.hide_responses, e.created_at,
               (select count(*) from responses r where r.event_id = e.id) as response_count
        from events e
        where e.id = ${id}
      `;
      if (rows[0]) collected.push(rows[0]);
    }
    return collected.map((row) => ({
      ...publicEvent(mapEvent(row), false),
      responseCount: Number(row.response_count),
    })) satisfies EventSummary[];
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator((input: { id: string; creatorToken?: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const userId = await optionalUserId();
    const rows = await sql<EventRow>`
      select id, owner_id, creator_token, title, timezone, dates,
             start_hour, end_hour, slot_minutes, hide_responses, created_at
      from events where id = ${data.id}
    `;
    const row = rows[0];
    if (!row) throw new Error("Poll not found");
    const allowed =
      (userId != null && row.owner_id === userId) ||
      (data.creatorToken != null && data.creatorToken === row.creator_token);
    if (!allowed) throw new Error("You cannot delete this poll");
    await sql`delete from events where id = ${data.id}`;
    return { ok: true };
  });

export const duplicateEvent = createServerFn({ method: "POST" })
  .validator((input: { id: string; creatorToken: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<EventRow>`
      select id, owner_id, creator_token, title, timezone, dates,
             start_hour, end_hour, slot_minutes, hide_responses, created_at
      from events where id = ${data.id}
    `;
    const row = rows[0];
    if (!row) throw new Error("Poll not found");
    const userId = await optionalUserId();
    const nextId = shortId(10);
    const title = row.title.endsWith("(copy)") ? row.title : `${row.title} (copy)`;
    await sql`
      insert into events (
        id, owner_id, creator_token, title, timezone, dates,
        start_hour, end_hour, slot_minutes, hide_responses
      ) values (
        ${nextId},
        ${userId},
        ${data.creatorToken},
        ${title},
        ${row.timezone},
        ${row.dates},
        ${row.start_hour},
        ${row.end_hour},
        ${row.slot_minutes},
        ${row.hide_responses}
      )
    `;
    return { id: nextId, creatorToken: data.creatorToken };
  });

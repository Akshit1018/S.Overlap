-- Overlap polls + responses. Dates and slots are JSON text for PGLite/Neon parity.
create table if not exists events (
  id text primary key,
  owner_id text,
  creator_token text not null,
  title text not null,
  timezone text not null,
  dates text not null,
  start_hour integer not null,
  end_hour integer not null,
  slot_minutes integer not null default 30,
  hide_responses boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists responses (
  id text primary key,
  event_id text not null references events (id) on delete cascade,
  user_id text,
  guest_token text not null,
  name text not null,
  hue integer not null default 0,
  slots text not null,
  updated_at timestamptz not null default now()
);

create index if not exists events_owner_id_idx on events (owner_id);
create index if not exists events_created_at_idx on events (created_at desc);
create index if not exists responses_event_id_idx on responses (event_id);
create unique index if not exists responses_event_guest_idx on responses (event_id, guest_token);

create extension if not exists pgcrypto;

create table public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  passphrase_hash text not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished', 'abandoned')),
  max_players smallint not null default 4 check (max_players between 2 and 4),
  match_mode text not null default 'single' check (match_mode in ('single', 'first-to-three')),
  host_user_id uuid not null references auth.users (id) on delete cascade,
  active_player_slot smallint check (active_player_slot between 1 and 4),
  public_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '12 hours',
  check (room_code = upper(room_code)),
  check (room_code ~ '^[A-Z0-9-]{4,16}$')
);

create table public.online_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  player_slot smallint not null check (player_slot between 1 and 4),
  display_name text not null check (char_length(display_name) between 1 and 20),
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  connected_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, player_slot)
);

create table public.online_private_states (
  player_id uuid primary key references public.online_room_players (id) on delete cascade,
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  private_state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.online_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.online_rooms (id) on delete cascade,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  recipient_player_id uuid references public.online_room_players (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (visibility = 'public' and recipient_player_id is null)
    or (visibility = 'private' and recipient_player_id is not null)
  )
);

create index online_room_players_user_id_idx on public.online_room_players (user_id);
create index online_room_players_room_id_idx on public.online_room_players (room_id);
create index online_private_states_room_id_idx on public.online_private_states (room_id);
create index online_room_events_room_created_idx on public.online_room_events (room_id, created_at desc);
create index online_rooms_expires_at_idx on public.online_rooms (expires_at);

create or replace function public.touch_online_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_online_rooms_updated_at
before update on public.online_rooms
for each row execute function public.touch_online_updated_at();

create trigger touch_online_private_states_updated_at
before update on public.online_private_states
for each row execute function public.touch_online_updated_at();

alter table public.online_rooms enable row level security;
alter table public.online_room_players enable row level security;
alter table public.online_private_states enable row level security;
alter table public.online_room_events enable row level security;

create or replace function public.is_online_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.online_room_players players
    where players.room_id = p_room_id
      and players.user_id = auth.uid()
  );
$$;

create or replace function public.is_online_player_owner(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.online_room_players players
    where players.id = p_player_id
      and players.user_id = auth.uid()
  );
$$;

create policy "room members can read their rooms"
on public.online_rooms
for select
to authenticated
using (public.is_online_room_member(online_rooms.id));

create policy "room members can read room players"
on public.online_room_players
for select
to authenticated
using (public.is_online_room_member(online_room_players.room_id));

create policy "players can read only their private state"
on public.online_private_states
for select
to authenticated
using (public.is_online_player_owner(online_private_states.player_id));

create policy "room members can read visible room events"
on public.online_room_events
for select
to authenticated
using (
  public.is_online_room_member(online_room_events.room_id)
  and (
    visibility = 'public'
    or public.is_online_player_owner(online_room_events.recipient_player_id)
  )
);

create or replace function public.create_online_room(
  p_room_code text,
  p_passphrase text,
  p_display_name text,
  p_max_players smallint default 4,
  p_match_mode text default 'single'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid;
  v_player_id uuid;
  v_room_code text := upper(trim(p_room_code));
  v_display_name text := nullif(trim(p_display_name), '');
begin
  if v_user_id is null then
    raise exception 'anonymous sign-in is required';
  end if;

  if v_room_code !~ '^[A-Z0-9-]{4,16}$' then
    raise exception 'room code must be 4-16 uppercase letters, numbers, or hyphen';
  end if;

  if char_length(coalesce(p_passphrase, '')) < 4 then
    raise exception 'passphrase must be at least 4 characters';
  end if;

  if v_display_name is null or char_length(v_display_name) > 20 then
    raise exception 'display name must be 1-20 characters';
  end if;

  insert into public.online_rooms (
    room_code,
    passphrase_hash,
    max_players,
    match_mode,
    host_user_id
  )
  values (
    v_room_code,
    crypt(p_passphrase, gen_salt('bf')),
    p_max_players,
    p_match_mode,
    v_user_id
  )
  returning id into v_room_id;

  insert into public.online_room_players (
    room_id,
    user_id,
    player_slot,
    display_name,
    is_host
  )
  values (v_room_id, v_user_id, 1, v_display_name, true)
  returning id into v_player_id;

  insert into public.online_private_states (room_id, player_id)
  values (v_room_id, v_player_id);

  return jsonb_build_object(
    'room_id', v_room_id,
    'player_id', v_player_id,
    'player_slot', 1,
    'room_code', v_room_code
  );
end;
$$;

create or replace function public.join_online_room(
  p_room_code text,
  p_passphrase text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.online_rooms%rowtype;
  v_existing public.online_room_players%rowtype;
  v_player_id uuid;
  v_slot smallint;
  v_room_code text := upper(trim(p_room_code));
  v_display_name text := nullif(trim(p_display_name), '');
begin
  if v_user_id is null then
    raise exception 'anonymous sign-in is required';
  end if;

  if v_display_name is null or char_length(v_display_name) > 20 then
    raise exception 'display name must be 1-20 characters';
  end if;

  select *
  into v_room
  from public.online_rooms
  where room_code = v_room_code
    and status = 'lobby'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'room not found';
  end if;

  if v_room.passphrase_hash <> crypt(p_passphrase, v_room.passphrase_hash) then
    raise exception 'passphrase does not match';
  end if;

  select *
  into v_existing
  from public.online_room_players
  where room_id = v_room.id
    and user_id = v_user_id;

  if found then
    return jsonb_build_object(
      'room_id', v_existing.room_id,
      'player_id', v_existing.id,
      'player_slot', v_existing.player_slot,
      'room_code', v_room.room_code
    );
  end if;

  select candidate_slot::smallint
  into v_slot
  from generate_series(1, v_room.max_players) as candidate_slot
  where not exists (
    select 1
    from public.online_room_players players
    where players.room_id = v_room.id
      and players.player_slot = candidate_slot
  )
  order by candidate_slot
  limit 1;

  if v_slot is null then
    raise exception 'room is full';
  end if;

  insert into public.online_room_players (
    room_id,
    user_id,
    player_slot,
    display_name
  )
  values (v_room.id, v_user_id, v_slot, v_display_name)
  returning id into v_player_id;

  insert into public.online_private_states (room_id, player_id)
  values (v_room.id, v_player_id);

  return jsonb_build_object(
    'room_id', v_room.id,
    'player_id', v_player_id,
    'player_slot', v_slot,
    'room_code', v_room.room_code
  );
end;
$$;

revoke all on public.online_rooms from anon, authenticated;
revoke all on public.online_room_players from anon, authenticated;
revoke all on public.online_private_states from anon, authenticated;
revoke all on public.online_room_events from anon, authenticated;
revoke execute on function public.is_online_room_member(uuid) from public, anon;
revoke execute on function public.is_online_player_owner(uuid) from public, anon;
revoke execute on function public.create_online_room(text, text, text, smallint, text) from public, anon;
revoke execute on function public.join_online_room(text, text, text) from public, anon;

grant select on public.online_rooms to authenticated;
grant select on public.online_room_players to authenticated;
grant select on public.online_private_states to authenticated;
grant select on public.online_room_events to authenticated;
grant execute on function public.is_online_room_member(uuid) to authenticated;
grant execute on function public.is_online_player_owner(uuid) to authenticated;
grant execute on function public.create_online_room(text, text, text, smallint, text) to authenticated;
grant execute on function public.join_online_room(text, text, text) to authenticated;

alter table public.online_rooms replica identity full;
alter table public.online_room_players replica identity full;
alter table public.online_room_events replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end;
$$;

alter publication supabase_realtime add table public.online_rooms;
alter publication supabase_realtime add table public.online_room_players;
alter publication supabase_realtime add table public.online_room_events;

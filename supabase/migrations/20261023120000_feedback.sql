-- Anonymous in-app feedback.
--
-- The app never touches the table directly. The publishable key can only
-- call submit_feedback(), which validates, rate limits and inserts, and
-- ping(), which the keep-alive job uses so a free-plan project never idles
-- long enough to pause. Nothing here identifies a person: install_id is a
-- random UUID made on the phone and used only to stop one install flooding
-- the inbox.

create table public.feedback (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  category      text not null check (category in ('bug', 'idea', 'confusing', 'praise')),
  message       text not null check (char_length(btrim(message)) between 1 and 4000),
  contact_email text check (char_length(contact_email) <= 254),
  source        text not null default 'profile' check (source in ('profile', 'crash_screen')),
  app_version   text check (char_length(app_version) <= 32),
  platform      text check (platform in ('ios', 'android')),
  os_version    text check (char_length(os_version) <= 32),
  device_model  text check (char_length(device_model) <= 64),
  install_id    uuid not null,
  status        text not null default 'new' check (status in ('new', 'read', 'done'))
);

create index feedback_created_at_idx on public.feedback (created_at);
create index feedback_install_created_idx on public.feedback (install_id, created_at);

-- RLS on with no policies, and Supabase's default grants revoked: the
-- publishable key can neither read nor write rows.
alter table public.feedback enable row level security;
revoke all on table public.feedback from anon, authenticated;

create function public.submit_feedback(
  p_category      text,
  p_message       text,
  p_install_id    uuid,
  p_source        text default 'profile',
  p_contact_email text default null,
  p_app_version   text default null,
  p_platform      text default null,
  p_os_version    text default null,
  p_device_model  text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message text := btrim(p_message);
  v_email   text := nullif(btrim(p_contact_email), '');
  v_id      uuid;
begin
  -- 22023 (invalid_parameter_value) reaches the client as HTTP 400.
  if p_category is null or p_category not in ('bug', 'idea', 'confusing', 'praise') then
    raise exception 'invalid category' using errcode = '22023';
  end if;
  if v_message is null or char_length(v_message) not between 1 and 4000 then
    raise exception 'message must be 1-4000 characters' using errcode = '22023';
  end if;
  if p_install_id is null then
    raise exception 'missing install id' using errcode = '22023';
  end if;
  if p_source is null or p_source not in ('profile', 'crash_screen') then
    raise exception 'invalid source' using errcode = '22023';
  end if;
  if v_email is not null
     and (char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_platform is not null and p_platform not in ('ios', 'android') then
    raise exception 'invalid platform' using errcode = '22023';
  end if;
  if char_length(p_app_version) > 32
     or char_length(p_os_version) > 32
     or char_length(p_device_model) > 64 then
    raise exception 'device info too long' using errcode = '22023';
  end if;

  -- Rate limits. The client tells these apart from validation errors by
  -- message: install-limited messages wait a day, global ones retry sooner.
  if (select count(*) from public.feedback
      where install_id = p_install_id
        and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'rate_limited_install';
  end if;
  if (select count(*) from public.feedback
      where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate_limited_global';
  end if;

  -- The privacy policy promises deletion after 24 months; doing it here
  -- keeps that promise without a scheduler.
  delete from public.feedback where created_at < now() - interval '24 months';

  insert into public.feedback
    (category, message, contact_email, source, app_version, platform,
     os_version, device_model, install_id)
  values
    (p_category, v_message, v_email, p_source, p_app_version, p_platform,
     p_os_version, p_device_model, p_install_id)
  returning id into v_id;

  return v_id;
end;
$$;

create function public.ping()
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.feedback limit 1;
  return 'ok';
end;
$$;

-- Supabase grants EXECUTE on new public functions to anon and authenticated
-- by default; narrow both functions to anon only.
revoke execute on function public.submit_feedback(text, text, uuid, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_feedback(text, text, uuid, text, text, text, text, text, text)
  to anon;

revoke execute on function public.ping() from public, anon, authenticated;
grant execute on function public.ping() to anon;

notify pgrst, 'reload schema';

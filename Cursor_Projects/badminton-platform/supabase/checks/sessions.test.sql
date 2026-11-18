-- Behaviour checks for the sessions migration (run after members.test.sql).
\set ON_ERROR_STOP on
insert into public.sessions (id, club_id, title, starts_at, ends_at, capacity, registration_closes_at, created_by)
  select '30000000-0000-0000-0000-000000000001', id, 'Tuesday night', '2026-11-03 16:00+00', '2026-11-03 18:30+00', 8,
         '2026-11-03 14:00+00', '00000000-0000-0000-0000-000000000001'
  from public.clubs where slug = 'dubai-smashers';
-- sessions may cross midnight but must end after they start
do $$ begin
  insert into public.sessions (club_id, title, starts_at, ends_at, capacity, registration_closes_at, created_by)
    select id, 'Late session', '2026-11-04 18:30+00', '2026-11-04 21:00+00', 8, '2026-11-04 16:30+00', '00000000-0000-0000-0000-000000000001'
    from public.clubs where slug = 'dubai-smashers';
  begin
    insert into public.sessions (club_id, title, starts_at, ends_at, capacity, registration_closes_at, created_by)
      select id, 'Backwards', '2026-11-04 20:00+00', '2026-11-04 19:00+00', 8, '2026-11-04 18:00+00', '00000000-0000-0000-0000-000000000001'
      from public.clubs where slug = 'dubai-smashers';
    raise exception 'FAIL: session ending before start accepted';
  exception when check_violation then null; end;
end $$;
-- one active registration per player; waitlist positions unique and consistent
insert into public.registrations (session_id, club_id, player_id, status)
  select '30000000-0000-0000-0000-000000000001', c.id, p.id, 'registered'
  from public.clubs c, public.players p where c.slug = 'dubai-smashers' and p.first_name = 'Omar';
do $$ begin
  begin
    insert into public.registrations (session_id, club_id, player_id, status, waitlist_position)
      select '30000000-0000-0000-0000-000000000001', c.id, p.id, 'waitlisted', 1
      from public.clubs c, public.players p where c.slug = 'dubai-smashers' and p.first_name = 'Omar';
    raise exception 'FAIL: second active registration accepted';
  exception when unique_violation then null; end;
  begin
    insert into public.registrations (session_id, club_id, player_id, status)
      select '30000000-0000-0000-0000-000000000001', c.id, p.id, 'waitlisted'
      from public.clubs c, public.players p where c.slug = 'dubai-smashers' and p.first_name = 'Mark';
    raise exception 'FAIL: waitlisted without position accepted';
  exception when check_violation then null; end;
end $$;
-- a registration cannot point at a session of another club
do $$ begin
  begin
    insert into public.registrations (session_id, club_id, player_id, status)
      select '30000000-0000-0000-0000-000000000001', c.id, p.id, 'registered'
      from public.clubs c, public.players p where c.slug = 'sharjah-shuttlers' and p.first_name = 'Mark';
    raise exception 'FAIL: cross-club registration accepted';
  exception when foreign_key_violation then null; end;
end $$;
select 'ALL SESSIONS CHECKS PASSED' as result;

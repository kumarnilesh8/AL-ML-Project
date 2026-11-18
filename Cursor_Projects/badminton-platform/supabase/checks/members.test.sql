-- Behaviour checks for the members migration (run after foundation.test.sql).
\set ON_ERROR_STOP on
do $$ begin
  if (select join_code from public.clubs where slug = 'dubai-smashers') !~ '^[a-z0-9]{8,16}$' then raise exception 'FAIL: join code'; end if;
end $$;
-- new clubs default to open
insert into public.clubs (slug, name, created_by, join_code)
  values ('sharjah-shuttlers', 'Sharjah Shuttlers', '00000000-0000-0000-0000-000000000001', 'abcd1234ef');
do $$ begin
  if (select join_policy from public.clubs where slug = 'sharjah-shuttlers') <> 'open' then raise exception 'FAIL: default join policy'; end if;
end $$;
-- guests must be adults without accounts
do $$ begin
  begin
    insert into public.players (first_name, display_name, created_by_club_id, account_id)
      select 'G', 'G', id, '00000000-0000-0000-0000-000000000002' from public.clubs where slug = 'dubai-smashers';
    raise exception 'FAIL: guest with account accepted';
  exception when check_violation then null; end;
  insert into public.players (first_name, display_name, created_by_club_id)
    select 'Mark', 'Mark', id from public.clubs where slug = 'dubai-smashers';
end $$;
-- juniors cannot join clubs that do not allow juniors
update public.clubs set juniors_allowed = false where slug = 'sharjah-shuttlers';
do $$ begin
  begin
    insert into public.club_members (club_id, player_id)
      select c.id, p.id from public.clubs c, public.players p where c.slug = 'sharjah-shuttlers' and p.first_name = 'Sami';
    raise exception 'FAIL: junior joined a no-juniors club';
  exception when check_violation then null; end;
end $$;
-- invitation tokens are unique
insert into public.club_invites (club_id, email, token_hash, expires_at, created_by)
  select id, 'friend@example.com', 'hash-1', now() + interval '14 days', '00000000-0000-0000-0000-000000000001' from public.clubs where slug = 'dubai-smashers';
do $$ begin
  begin
    insert into public.club_invites (club_id, email, token_hash, expires_at, created_by)
      select id, 'other@example.com', 'hash-1', now(), '00000000-0000-0000-0000-000000000001' from public.clubs where slug = 'dubai-smashers';
    raise exception 'FAIL: duplicate token';
  exception when unique_violation then null; end;
end $$;
select 'ALL MEMBERS CHECKS PASSED' as result;

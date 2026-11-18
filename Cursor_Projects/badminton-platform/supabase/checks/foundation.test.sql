-- Behaviour checks for the foundation migration. Each block must succeed; failures raise errors.
\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-000000000001', 'owner@example.com'),
                              ('00000000-0000-0000-0000-000000000002', 'parent@example.com');
-- 1. sign-up trigger created accounts
do $$ begin
  if (select count(*) from public.accounts) <> 2 then raise exception 'accounts not created'; end if;
end $$;
-- 2. players, club, owner membership, courts
insert into public.players (id, account_id, first_name, display_name)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Omar', 'Omar');
insert into public.clubs (id, slug, name, created_by)
  values ('20000000-0000-0000-0000-000000000001', 'dubai-smashers', 'Dubai Smashers', '00000000-0000-0000-0000-000000000001');
insert into public.club_members (club_id, player_id, role)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner');
insert into public.courts (club_id, name, sort_order)
  values ('20000000-0000-0000-0000-000000000001', 'Court 1', 1), ('20000000-0000-0000-0000-000000000001', 'Court 2', 2);
do $$ begin
  if (select time_zone from public.clubs limit 1) <> 'Asia/Dubai' then raise exception 'default time zone'; end if;
end $$;
-- 3. junior must be parent-managed with consent
do $$ begin
  begin
    insert into public.players (first_name, display_name, age_band) values ('Kid', 'Kid', 'under_14');
    raise exception 'FAIL: unmanaged junior accepted';
  exception when check_violation then null; end;
  insert into public.players (first_name, display_name, age_band, managed_by_account_id, consent_recorded_at)
    values ('Sami', 'Sami', 'under_14', '00000000-0000-0000-0000-000000000002', now());
end $$;
-- 4. a junior (no own account) cannot be an organiser
do $$ begin
  begin
    insert into public.club_members (club_id, player_id, role)
      select '20000000-0000-0000-0000-000000000001', id, 'organiser' from public.players where first_name = 'Sami';
    raise exception 'FAIL: junior organiser accepted';
  exception when check_violation then null; end;
end $$;
-- 5. the last owner cannot be removed or demoted
do $$ begin
  begin
    update public.club_members set role = 'admin' where player_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: last owner demoted';
  exception when check_violation then null; end;
end $$;
-- 6. audit log is append-only
insert into public.audit_log (action, entity_type) values ('club.created', 'club');
do $$ begin
  begin
    update public.audit_log set action = 'x';
    raise exception 'FAIL: audit log updated';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.audit_log;
    raise exception 'FAIL: audit log deleted';
  exception when insufficient_privilege then null; end;
end $$;
-- 7. invalid club slug and duplicate court names rejected
do $$ begin
  begin
    insert into public.clubs (slug, name, created_by) values ('Bad Slug!', 'X club', '00000000-0000-0000-0000-000000000001');
    raise exception 'FAIL: bad slug accepted';
  exception when check_violation then null; end;
  begin
    insert into public.courts (club_id, name) values ('20000000-0000-0000-0000-000000000001', 'court 1');
    raise exception 'FAIL: duplicate court accepted';
  exception when unique_violation then null; end;
end $$;
-- 8. membership helper uses the signed-in user
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$ begin
  if not app.is_club_member('20000000-0000-0000-0000-000000000001') then raise exception 'FAIL: owner not member'; end if;
  if not app.has_club_role('20000000-0000-0000-0000-000000000001', array['owner']::public.club_role[]) then raise exception 'FAIL: owner role'; end if;
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$ begin
  if app.has_club_role('20000000-0000-0000-0000-000000000001', array['owner','admin','organiser']::public.club_role[]) then raise exception 'FAIL: parent has role'; end if;
end $$;
-- 9. client roles cannot read tables (deny by default)
set role authenticated;
do $$ begin
  begin
    perform 1 from public.clubs;
    raise exception 'FAIL: authenticated can read clubs';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'ALL FOUNDATION CHECKS PASSED' as result;

-- Admin-controlled flag: show or hide the "rabbi login" button on the students' home screen.
-- One row only (id = true). Everyone can read it; only an admin can change it, through the function below.
create table if not exists public.yd_site_config (
  id boolean primary key default true check (id),
  show_rabbi_login boolean not null default true,
  updated_date timestamptz not null default now()
);

insert into public.yd_site_config (id) values (true) on conflict do nothing;

alter table public.yd_site_config enable row level security;

drop policy if exists yd_site_config_select on public.yd_site_config;
create policy yd_site_config_select on public.yd_site_config
  for select to anon, authenticated using (true);

-- Read-only for everyone; changes only through the admin function below.
revoke insert, update, delete, truncate on public.yd_site_config from anon, authenticated;

create or replace function public.yd_set_rabbi_login_visible(payload jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  me text := public.yd_email();
  v boolean;
begin
  if auth.uid() is null then raise exception 'נדרשת התחברות'; end if;
  if not public.yd_is_admin() then raise exception 'אין הרשאה'; end if;
  if payload ->> 'visible' is null or payload ->> 'visible' not in ('true', 'false') then
    raise exception 'פרטים לא תקינים';
  end if;
  v := (payload ->> 'visible')::boolean;

  update public.yd_site_config set show_rabbi_login = v, updated_date = now() where id = true;

  insert into public.yd_audit_log (action, target_email, performed_by_email, details)
  values ('toggle_rabbi_login', '', me,
          case when v then 'כפתור כניסת רבנים הוצג במסך הראשי' else 'כפתור כניסת רבנים הוסתר מהמסך הראשי' end);

  return jsonb_build_object('success', true, 'visible', v);
end $function$;

revoke all on function public.yd_set_rabbi_login_visible(jsonb) from public, anon;
grant execute on function public.yd_set_rabbi_login_visible(jsonb) to authenticated;

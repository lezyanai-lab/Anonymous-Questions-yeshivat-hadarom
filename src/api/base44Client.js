// Backend client. The UI was written against the Base44 SDK shape (base44.entities / functions / auth),
// so this module keeps that shape but talks to Supabase (Postgres + Auth + Realtime).
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

// ---------- entities ----------
const TABLES = {
  Rabbi: 'yd_rabbis',
  Message: 'yd_messages',
  AccessRequest: 'yd_access_requests',
  AuditLog: 'yd_audit_log',
  Settings: 'yd_settings',
};

// Rabbi e-mails are only readable by admins (through an RPC); everyone else gets the public columns.
const RABBI_PUBLIC_COLUMNS = 'id,display_name,description,active,approval_status,created_date,updated_date';

const fail = (error) => {
  const message = error?.message || 'שגיאה';
  const err = new Error(message);
  err.status = error?.status || (error?.code === 'PGRST301' ? 401 : 400);
  err.response = { data: { error: message } };
  throw err;
};

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

let profileCache = { id: null, profile: null };
async function currentProfile() {
  const session = await currentSession();
  if (!session) { profileCache = { id: null, profile: null }; return null; }
  if (profileCache.id === session.user.id && profileCache.profile) return profileCache.profile;
  const { data, error } = await supabase
    .from('yd_profiles')
    .select('id,email,display_name,role,is_owner')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error) fail(error);
  const profile = data || { id: session.user.id, email: session.user.email, display_name: null, role: 'user', is_owner: false };
  profileCache = { id: session.user.id, profile };
  return profile;
}
const invalidateProfile = () => { profileCache = { id: null, profile: null }; };

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Server-side filter (Mongo-style subset: equality, $ne, $in, $gt/$gte/$lt/$lte, $regex, $or)
function postgrestValue(v) { return v === null ? 'null' : String(v); }
function orClause(cond) {
  return Object.entries(cond).map(([k, v]) => {
    if (isPlainObject(v)) {
      if ('$regex' in v) return `${k}.ilike.*${String(v.$regex).replace(/[,()*]/g, ' ')}*`;
      if ('$ne' in v) return `${k}.neq.${postgrestValue(v.$ne)}`;
      throw new Error(`Unsupported operator in $or for ${k}`);
    }
    return `${k}.eq.${postgrestValue(v)}`;
  }).join(',');
}
function applyQuery(q, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    if (key === '$or') { q = q.or(value.map((c) => `and(${orClause(c)})`).join(',')); continue; }
    if (isPlainObject(value)) {
      for (const [op, v] of Object.entries(value)) {
        if (op === '$ne') q = v === null ? q.not(key, 'is', null) : q.neq(key, v);
        else if (op === '$in') q = q.in(key, v);
        else if (op === '$gt') q = q.gt(key, v);
        else if (op === '$gte') q = q.gte(key, v);
        else if (op === '$lt') q = q.lt(key, v);
        else if (op === '$lte') q = q.lte(key, v);
        else if (op === '$regex') q = q.ilike(key, `%${v}%`);
        else if (op === '$options') continue;
        else throw new Error(`Unsupported operator ${op}`);
      }
    } else q = q.eq(key, value);
  }
  return q;
}

// Client-side matcher, only for the admin rabbi list (a few dozen rows)
function matches(row, query = {}) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '$or') return value.some((c) => matches(row, c));
    if (isPlainObject(value)) {
      return Object.entries(value).every(([op, v]) => {
        const field = row[key];
        if (op === '$ne') return field !== v;
        if (op === '$in') return v.includes(field);
        if (op === '$regex') return new RegExp(v, value.$options || '').test(field ?? '');
        if (op === '$options') return true;
        return true;
      });
    }
    return row[key] === value;
  });
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = a[field] ?? '', y = b[field] ?? '';
    return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
  });
}

function entity(name) {
  const table = TABLES[name];
  return {
    async filter(query = {}, options = {}) {
      const { sort, limit } = options;
      if (name === 'Rabbi' && (await currentProfile())?.role === 'admin') {
        const { data, error } = await supabase.rpc('yd_admin_rabbis');
        if (error) fail(error);
        let rows = sortRows((data || []).filter((r) => matches(r, query)), sort);
        if (limit) rows = rows.slice(0, limit);
        return { items: rows };
      }
      let q = supabase.from(table).select(name === 'Rabbi' ? RABBI_PUBLIC_COLUMNS : '*');
      q = applyQuery(q, query);
      if (sort) q = q.order(sort.replace(/^-/, ''), { ascending: !sort.startsWith('-') });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) fail(error);
      return { items: data || [] };
    },
    async count(query = {}) {
      let q = supabase.from(table).select('id', { count: 'exact', head: true });
      q = applyQuery(q, query);
      const { count, error } = await q;
      if (error) fail(error);
      return count || 0;
    },
    async create(data) {
      const { data: row, error } = await supabase.from(table).insert(data).select('id').single();
      if (error) fail(error);
      return row;
    },
    async update(id, data) {
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) fail(error);
      return { id };
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) fail(error);
      return { id };
    },
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => callback(payload))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
  };
}

// ---------- functions (Postgres RPC) ----------
const FUNCTIONS = {
  sendMessage: 'yd_send_message',
  requestRabbiAccess: 'yd_request_rabbi_access',
  requestAccess: 'yd_request_access',
  saveUserName: 'yd_save_user_name',
  linkRabbi: 'yd_link_rabbi',
  manageRabbi: 'yd_manage_rabbi',
  manageAdmin: 'yd_manage_admin',
  forwardMessage: 'yd_forward_message',
  createRabbiAccount: 'yd_create_rabbi_account',
};

// ---------- auth ----------
const baseUrlPath = (path = '/') => {
  const clean = path.startsWith('http') ? new URL(path).pathname : path;
  return new URL(clean, window.location.origin).toString();
};

export const base44 = {
  entities: Object.fromEntries(Object.keys(TABLES).map((n) => [n, entity(n)])),

  functions: {
    async invoke(name, payload = {}) {
      const rpc = FUNCTIONS[name];
      if (!rpc) throw new Error(`Unknown function ${name}`);
      const { data, error } = await supabase.rpc(rpc, { payload });
      if (error) fail(error);
      if (['requestRabbiAccess', 'manageAdmin'].includes(name)) invalidateProfile();
      return { data };
    },
  },

  auth: {
    async isAuthenticated() { return !!(await currentSession()); },
    async me() {
      const profile = await currentProfile();
      if (!profile) { const e = new Error('Authentication required'); e.status = 401; throw e; }
      return { ...profile, full_name: profile.display_name };
    },
    async loginWithProvider(provider, fromUrl = '/') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: baseUrlPath(fromUrl) },
      });
      if (error) { console.error(error); throw error; }
    },
    async loginWithPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      invalidateProfile();
      if (error) {
        const e = new Error(/invalid login credentials/i.test(error.message) ? 'המייל או הסיסמה שגויים' : error.message);
        e.status = error.status;
        throw e;
      }
    },
    redirectToLogin() {
      window.location.href = `${import.meta.env.BASE_URL}login`;
    },
    async logout(redirectUrl) {
      invalidateProfile();
      await supabase.auth.signOut();
      if (redirectUrl) window.location.href = redirectUrl;
    },
  },

  app: {
    async getPublicSettings() { return {}; },
  },
};

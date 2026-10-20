import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ACTIONS = ["approve", "reject", "revoke"];
const ACTION_LABELS = {
  approve: "approve_admin",
  reject: "reject_admin",
  revoke: "revoke_admin"
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "אין הרשאה" }, { status: 403 });
    }

    // ודא שהמשתמש הוא המנהל הראשי (בעל האפליקציה)
    const { items: settings } = await base44.asServiceRole.entities.Settings.filter({}, { limit: 1 });
    if (!settings || settings.length === 0) {
      return Response.json({ error: "הגדרות המערכת חסרות — נא לאתחל את המערכת" }, { status: 500 });
    }
    if (settings[0].owner_email !== user.email) {
      return Response.json({ error: "רק המנהל הראשי יכול לאשר ולבטל מנהלים" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { request_id, action } = body;
    if (!request_id || !ACTIONS.includes(action)) {
      return Response.json({ error: "פרטים לא תקינים" }, { status: 400 });
    }

    let request;
    try {
      request = await base44.asServiceRole.entities.AccessRequest.get(request_id);
    } catch (e) {
      return Response.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }
    if (!request || request.request_type !== "admin") {
      return Response.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      try {
        await base44.asServiceRole.entities.User.update(request.user_id, { role: "admin" });
      } catch (e) {
        return Response.json({ error: "לא ניתן לעדכן את התפקיד (ייתכן שמדובר בבעל האפליקציה)" }, { status: 400 });
      }
      await base44.asServiceRole.entities.AccessRequest.update(request_id, {
        status: "approved", decided_by_email: user.email, decided_date: now
      });
    } else if (action === "reject") {
      await base44.asServiceRole.entities.AccessRequest.update(request_id, {
        status: "rejected", decided_by_email: user.email, decided_date: now
      });
    } else if (action === "revoke") {
      try {
        await base44.asServiceRole.entities.User.update(request.user_id, { role: "user" });
      } catch (e) {
        return Response.json({ error: "לא ניתן לבטל את התפקיד" }, { status: 400 });
      }
      await base44.asServiceRole.entities.AccessRequest.update(request_id, {
        status: "revoked", decided_by_email: user.email, decided_date: now
      });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      action: ACTION_LABELS[action],
      target_email: request.google_email || "",
      performed_by_email: user.email,
      details: `משתמש: ${request.entered_name || ""} — ${action}`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה" }, { status: 500 });
  }
}

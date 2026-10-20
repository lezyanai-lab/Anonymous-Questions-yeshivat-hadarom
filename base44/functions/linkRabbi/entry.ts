import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { request_id, rabbi_id, display_name, description } = body;
    if (!request_id) {
      return Response.json({ error: "חסר מזהה בקשה" }, { status: 400 });
    }

    let request;
    try {
      request = await base44.asServiceRole.entities.AccessRequest.get(request_id);
    } catch (e) {
      return Response.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }
    if (!request || request.request_type !== "rabbi") {
      return Response.json({ error: "הבקשה לא נמצאה" }, { status: 404 });
    }

    const now = new Date().toISOString();
    let linkedRabbiId = null;

    if (rabbi_id) {
      // קישור לרב קיים
      let rabbi;
      try {
        rabbi = await base44.asServiceRole.entities.Rabbi.get(rabbi_id);
      } catch (e) {
        return Response.json({ error: "הרב לא נמצא" }, { status: 404 });
      }
      if (!rabbi) return Response.json({ error: "הרב לא נמצא" }, { status: 404 });

      await base44.asServiceRole.entities.Rabbi.update(rabbi_id, {
        email: request.google_email,
        approval_status: "approved",
        active: true,
        approved_by_email: user.email,
        approved_date: now
      });
      linkedRabbiId = rabbi_id;
    } else {
      // יצירת רב חדש וקישור אוטומטי
      const name = (display_name && display_name.trim()) || request.entered_name || "רב חדש";
      const created = await base44.asServiceRole.entities.Rabbi.create({
        display_name: name,
        description: (description && description.trim()) || "",
        email: request.google_email,
        approval_status: "approved",
        active: true,
        approved_by_email: user.email,
        approved_date: now
      });
      linkedRabbiId = created?.id || null;
    }

    await base44.asServiceRole.entities.AccessRequest.update(request_id, {
      status: "approved",
      linked_rabbi_id: linkedRabbiId,
      decided_by_email: user.email,
      decided_date: now
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action: "link_rabbi",
      target_email: request.google_email || "",
      performed_by_email: user.email,
      details: `קישור חשבון ל${rabbi_id ? "רב קיים" : "רב חדש"}: ${request.entered_name || ""}`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה בקישור הרב" }, { status: 500 });
  }
}

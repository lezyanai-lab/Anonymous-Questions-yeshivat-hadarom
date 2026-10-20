import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ACTIONS = ["approve", "reject", "revoke", "reactivate"];
const ACTION_LABELS = {
  approve: "approve_rabbi",
  reject: "reject_rabbi",
  revoke: "revoke_rabbi",
  reactivate: "reactivate_rabbi"
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });
    if (user.role !== "admin") {
      return Response.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { rabbi_id, action } = body;

    if (!rabbi_id || !ACTIONS.includes(action)) {
      return Response.json({ error: "פרטים לא תקינים" }, { status: 400 });
    }

    let rabbi;
    try {
      rabbi = await base44.asServiceRole.entities.Rabbi.get(rabbi_id);
    } catch (e) {
      return Response.json({ error: "הרב לא נמצא" }, { status: 404 });
    }
    if (!rabbi) return Response.json({ error: "הרב לא נמצא" }, { status: 404 });

    const now = new Date().toISOString();
    const updateFields = {};

    if (action === "approve" || action === "reactivate") {
      updateFields.approval_status = "approved";
      updateFields.active = true;
      updateFields.approved_by_email = user.email;
      updateFields.approved_date = now;
    } else if (action === "reject") {
      updateFields.approval_status = "rejected";
      updateFields.active = false;
    } else if (action === "revoke") {
      updateFields.approval_status = "revoked";
      updateFields.active = false;
    }

    await base44.asServiceRole.entities.Rabbi.update(rabbi_id, updateFields);

    // בשלילת הרשאה — העברת כל ההודעות שלו למנהל כדי לחסום גישה גם אם עדיין מחובר
    if (action === "revoke" && rabbi.email) {
      let hasMore = true;
      while (hasMore) {
        const res = await base44.asServiceRole.entities.Message.updateMany(
          { assigned_to_email: rabbi.email },
          { $set: { assigned_to_email: user.email, status: "הועברה" } }
        );
        hasMore = !!res?.has_more;
      }
    }

    // תיעוד ביומן אירועים
    await base44.asServiceRole.entities.AuditLog.create({
      action: ACTION_LABELS[action],
      target_email: rabbi.email || "",
      performed_by_email: user.email,
      details: `רב: ${rabbi.display_name || ""} — ${action}`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה" }, { status: 500 });
  }
}

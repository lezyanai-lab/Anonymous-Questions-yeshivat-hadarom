import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { request_type } = body;
    if (!["rabbi", "admin"].includes(request_type)) {
      return Response.json({ error: "סוג בקשה לא תקין" }, { status: 400 });
    }

    // ודא שהמשתמש הזין שם
    const fullUser = await base44.asServiceRole.entities.User.get(user.id);
    if (!fullUser.display_name || !fullUser.display_name.trim()) {
      return Response.json({ error: "נא להזין שם תחילה" }, { status: 400 });
    }

    // בדוק אם כבר יש בקשה פעילה (pending או approved) מאותו סוג
    const { items } = await base44.asServiceRole.entities.AccessRequest.filter(
      { user_id: user.id, request_type, status: { $in: ["pending", "approved"] } },
      { limit: 1 }
    );
    if (items && items.length > 0) {
      return Response.json({ error: "כבר קיימת בקשה פעילה מסוג זה", existing_status: items[0].status }, { status: 409 });
    }

    await base44.asServiceRole.entities.AccessRequest.create({
      user_id: user.id,
      google_email: user.email,
      entered_name: fullUser.display_name.trim(),
      request_type,
      status: "pending"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה בשליחת הבקשה" }, { status: 500 });
  }
}

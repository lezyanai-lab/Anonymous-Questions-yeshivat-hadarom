import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { message_id, target_rabbi_id } = body;

    if (!message_id || !target_rabbi_id) {
      return Response.json({ error: "חסרים פרטים להעברה" }, { status: 400 });
    }

    let message;
    try {
      message = await base44.asServiceRole.entities.Message.get(message_id);
    } catch (e) {
      return Response.json({ error: "הודעה לא נמצאה" }, { status: 404 });
    }
    if (!message) return Response.json({ error: "הודעה לא נמצאה" }, { status: 404 });

    const isAdmin = user.role === "admin";

    // אם המשתמש אינו מנהל — בדיקת אישור ובעלות
    if (!isAdmin) {
      const { items: myRabbi } = await base44.asServiceRole.entities.Rabbi.filter(
        { email: user.email, approval_status: "approved" },
        { limit: 1 }
      );
      if (!myRabbi || myRabbi.length === 0) {
        return Response.json({ error: "אין הרשאה לבצע פעולה זו" }, { status: 403 });
      }
      if (message.assigned_to_email !== user.email) {
        return Response.json({ error: "אין הרשאה להעביר הודעה זו" }, { status: 403 });
      }
    }

    const { items: targetRabbis } = await base44.asServiceRole.entities.Rabbi.filter(
      { id: target_rabbi_id, approval_status: "approved", active: true },
      { limit: 1 }
    );
    if (!targetRabbis || targetRabbis.length === 0 || !targetRabbis[0].email) {
      return Response.json({ error: "רב היעד לא נמצא או אינו מאושר" }, { status: 400 });
    }
    const targetEmail = targetRabbis[0].email;
    if (targetEmail === user.email) {
      return Response.json({ error: "לא ניתן להעביר הודעה לעצמך" }, { status: 400 });
    }

    await base44.asServiceRole.entities.Message.update(message_id, {
      assigned_to_email: targetEmail,
      forwarded_from_email: user.email,
      status: "הועברה",
      is_read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה בהעברת ההודעה" }, { status: 500 });
  }
}

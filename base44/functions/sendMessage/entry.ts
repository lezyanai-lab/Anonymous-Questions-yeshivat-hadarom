import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CATEGORIES = ["שאלה תורנית", "עניין אישי", "בעיה חברתית", "דיווח חשוב", "אחר"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { rabbi_id, category, content } = body;

    if (!rabbi_id || typeof rabbi_id !== "string") {
      return Response.json({ error: "נא לבחור רב" }, { status: 400 });
    }
    if (!category || !CATEGORIES.includes(category)) {
      return Response.json({ error: "קטגוריה לא תקינה" }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return Response.json({ error: "נא לכתוב הודעה בת 10 תווים לפחות" }, { status: 400 });
    }
    if (content.length > 5000) {
      return Response.json({ error: "ההודעה ארוכה מדי (מקסימום 5000 תווים)" }, { status: 400 });
    }

    let rabbi;
    try {
      rabbi = await base44.asServiceRole.entities.Rabbi.get(rabbi_id);
    } catch (e) {
      return Response.json({ error: "הרב שנבחר אינו זמין כעת" }, { status: 400 });
    }
    if (!rabbi || !rabbi.active || rabbi.approval_status !== "approved" || !rabbi.email) {
      return Response.json({ error: "הרב שנבחר אינו זמין כעת" }, { status: 400 });
    }

    // הגנה בסיסית מפני ספאם: הגבלה כללית של שליחות בחלון זמן קצר
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentCount = await base44.asServiceRole.entities.Message.count({
      created_date: { $gte: fiveMinAgo }
    });
    if (recentCount >= 25) {
      return Response.json({ error: "נשלחו יותר מדי הודעות לאחרונה, נא לנסות שוב מאוחר יותר" }, { status: 429 });
    }

    const message = await base44.asServiceRole.entities.Message.create({
      assigned_to_email: rabbi.email,
      category,
      content: content.trim(),
      status: "חדשה",
      is_read: false
    });

    return Response.json({ success: true, message_id: message.id });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה בשליחת ההודעה" }, { status: 500 });
  }
}

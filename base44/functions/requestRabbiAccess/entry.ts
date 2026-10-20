import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });

    // בדיקת בעלים — זיהוי מאובטח לפי כתובת המייל המאומתת מול Settings
    // (לא לפי שם שהוזן בטופס). אם המשתמש הוא בעל האפליקציה ועדיין אינו מנהל —
    // העלה אוטומטית למנהל ראשי. פעולה זו חוזרת על עצמה בכל התחברות ומבטיחה
    // שהבעלים תמיד מזוהה כמנהל הראשי, גם לאחר יציאה והתחברות מחדש.
    const { items: settingsItems } = await base44.asServiceRole.entities.Settings.filter({}, { limit: 1 });
    const ownerEmail = settingsItems?.[0]?.owner_email;
    const isOwner = !!(ownerEmail && user.email === ownerEmail);

    if (isOwner) {
      // ודא תפקיד מנהל וסימון בעלות קבוע ברשומה (הסימון חוסם שינוי תפקידים ע"י כל משתמש אחר)
      if (user.role !== "admin" || user.is_owner !== true) {
        try {
          await base44.asServiceRole.entities.User.update(user.id, { role: "admin", is_owner: true });
        } catch (e) {
          // ייתכן שהתפקיד כבר מנהל או מוגן על ידי הפלטפורמה — נמשיך
        }
      }
      return Response.json({ status: "admin", just_promoted: user.role !== "admin" });
    }

    // מנהל — הפניה לאזור הניהול
    if (user.role === "admin") {
      return Response.json({ status: "admin" });
    }

    // בדיקה: האם המשתמש מקושר לרב מאושר
    const { items: rabbis } = await base44.asServiceRole.entities.Rabbi.filter(
      { email: user.email, approval_status: "approved" },
      { limit: 1 }
    );
    if (rabbis && rabbis.length > 0) {
      return Response.json({ status: "approved" });
    }

    // שליפת פרטי המשתמש (האם הזין שם)
    const fullUser = await base44.asServiceRole.entities.User.get(user.id);
    const has_name = !!(fullUser.display_name && fullUser.display_name.trim());

    // שליפת בקשות הגישה של המשתמש
    const { items: requests } = await base44.asServiceRole.entities.AccessRequest.filter(
      { user_id: user.id },
      { sort: "-created_date", limit: 20 }
    );

    const rabbi_request = requests?.find(r => r.request_type === "rabbi") || null;
    const admin_request = requests?.find(r => r.request_type === "admin") || null;

    return Response.json({
      status: "pending",
      has_name,
      display_name: fullUser.display_name || "",
      google_email: user.email,
      rabbi_request: rabbi_request ? { status: rabbi_request.status, id: rabbi_request.id } : null,
      admin_request: admin_request ? { status: admin_request.status, id: admin_request.id } : null
    });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה" }, { status: 500 });
  }
}

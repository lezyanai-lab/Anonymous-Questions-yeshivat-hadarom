import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "נדרשת התחברות" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { display_name } = body;
    if (!display_name || !display_name.trim() || display_name.trim().length < 2) {
      return Response.json({ error: "נא להזין שם תקין (לפחות 2 תווים)" }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user.id, { display_name: display_name.trim() });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "אירעה שגיאה בשמירת השם" }, { status: 500 });
  }
}

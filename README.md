# ישיבת הדרום — פנייה לרב

אתר פנייה אנונימית של תלמידים לרבני הישיבה (React + Vite + Tailwind), מאוחסן ב-GitHub Pages.
ה-Backend (בסיס נתונים, הרשאות והתחברות עם Google או אימייל וסיסמה) רץ על Supabase. הקובץ `src/api/base44Client.js` שומר על המבנה של ה-SDK הישן של Base44 אבל מדבר עם Supabase.

האתר: https://lezyanai-lab.github.io/Anonymous-Questions-yeshivat-hadarom/

## מבנה
- `src/` — קוד ה-Frontend
- `base44/functions`, `base44/entities` — גיבוי ישן של פונקציות ה-Backend וסכמות הנתונים מתקופת Base44 (לעיון בלבד; לא נבנים עם האתר ולא בשימוש)
- `.github/workflows/keep-supabase-awake.yml` — בקשת קריאה קטנה כל 3 ימים כדי שפרויקט ה-Supabase החינמי לא יושהה
- `public/404.html` — מאפשר ניווט ישיר לנתיבים כמו `/rabbi` ב-GitHub Pages
- `.github/workflows/deploy.yml` — בנייה ופרסום אוטומטי בכל push ל-`main`

## הרצה מקומית
```bash
npm install
npm run dev
```

## משתני סביבה (`.env.production`)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — מזהים ציבוריים של פרויקט ה-Supabase (הגישה לנתונים מוגבלת על ידי Row Level Security, ולכן בטוח לפרסם אותם).
נתיב הבסיס נקבע ב-`VITE_BASE_PATH` (ברירת מחדל: `/Anonymous-Questions-yeshivat-hadarom/`).

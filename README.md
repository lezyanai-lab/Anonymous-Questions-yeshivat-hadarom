# ישיבת הדרום — פנייה לרב

אתר פנייה אנונימית של תלמידים לרבני הישיבה (React + Vite + Tailwind), מאוחסן ב-GitHub Pages.
ה-Backend (בסיס הנתונים, הפונקציות וההתחברות עם Google) נשאר ב-Base44 ונגיש דרך ה-SDK.

האתר: https://lezyanai-lab.github.io/Anonymous-Questions-yeshivat-hadarom/

## מבנה
- `src/` — קוד ה-Frontend
- `base44/functions`, `base44/entities` — גיבוי של פונקציות ה-Backend וסכמות הנתונים (לעיון/שחזור; לא נבנים עם האתר)
- `public/404.html` — מאפשר ניווט ישיר לנתיבים כמו `/rabbi` ב-GitHub Pages
- `.github/workflows/deploy.yml` — בנייה ופרסום אוטומטי בכל push ל-`main`

## הרצה מקומית
```bash
npm install
npm run dev
```

## משתני סביבה (`.env.production`)
`VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`, `VITE_BASE44_SERVER_URL` — מזהים ציבוריים של אפליקציית ה-Base44.
נתיב הבסיס נקבע ב-`VITE_BASE_PATH` (ברירת מחדל: `/Anonymous-Questions-yeshivat-hadarom/`).

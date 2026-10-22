import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { isAuthenticated, authChecked, isLoadingAuth, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("login");

  // משתמש שכבר מחובר — הפניה לאזור שלו
  if (authChecked && !isLoadingAuth && isAuthenticated && user) {
    return <Navigate to="/rabbi" replace />;
  }

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === "register" && name.trim().length < 2) { setError("נא להזין שם מלא"); return; }
    setError("");
    setLoading(true);
    try {
      if (mode === "register") await base44.auth.register({ email, password, name: name.trim() });
      else await base44.auth.loginWithPassword(email, password);
      window.location.href = `${import.meta.env.BASE_URL}rabbi`;
    } catch (err) {
      setError(err?.message || "הכניסה נכשלה, נא לנסות שוב");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={BookOpen}
      title="ישיבת הדרום"
      subtitle="כניסת רבנים"
      footer={
        <Link to="/" className="text-primary font-medium hover:underline">
          חזרה למסך התלמידים
        </Link>
      }
    >
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === "login"
            ? "כניסה לרבנים עם המייל והסיסמה שלך."
            : "רב חדש? נרשמים עם מייל וסיסמה לבחירתך. אחרי ההרשמה יש לבקש גישה, והמנהל יאשר."}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-3">
        {mode === "register" && (
          <Input
            type="text"
            autoComplete="name"
            placeholder="שם מלא"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12"
          />
        )}
        <Input
          type="email"
          dir="ltr"
          autoComplete="username"
          placeholder="מייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
        <Input
          type="password"
          dir="ltr"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          placeholder={mode === "register" ? "סיסמה (לפחות 8 תווים)" : "סיסמה"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12"
        />
        {mode === "register" && (
          <p className="text-xs text-muted-foreground leading-relaxed rounded-lg bg-secondary/60 p-3">
            כדאי להמציא סיסמה חדשה לאתר הזה, ולא להשתמש בסיסמה האמיתית שלך (של המייל, הבנק או אתרים אחרים).
            אם הסיסמה תדלוף או תיחשף, מי שמצא אותה לא יוכל להיכנס לשאר החשבונות שלך. את הסיסמה כדאי לשמור במקום בטוח.
          </p>
        )}
        <Button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full h-12 font-medium"
        >
          {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <LogIn className="w-4 h-4 ml-2" />}
          {mode === "register" ? "הרשמה" : "כניסה"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
        className="mt-4 w-full text-center text-sm text-primary font-medium hover:underline"
      >
        {mode === "login" ? "רב חדש? הרשמה" : "יש לי כבר חשבון — כניסה"}
      </button>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LogIn className="w-3.5 h-3.5" />
          <span>תלמידים אינם זקוקים לחשבון — ניתן לשלוח הודעה מהמסך הראשי</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          החיבור נשמר אוטומטית באופן מאובטח בדפדפן — אין צורך להתחבר מחדש בכל ביקור
        </p>
      </div>
    </AuthLayout>
  );
}

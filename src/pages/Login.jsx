import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuth } from "@/lib/AuthContext";

export default function Login() {
  const { isAuthenticated, authChecked, isLoadingAuth, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // משתמש שכבר מחובר — הפניה לאזור שלו
  if (authChecked && !isLoadingAuth && isAuthenticated && user) {
    return <Navigate to="/rabbi" replace />;
  }

  const handleGoogle = () => {
    setError("");
    setLoading(true);
    base44.auth.loginWithProvider("google", `${import.meta.env.BASE_URL}rabbi`);
  };

  return (
    <AuthLayout
      icon={BookOpen}
      title="ישיבת הדרום"
      subtitle="כניסת רבנים ומנהלים"
      footer={
        <Link to="/" className="text-primary font-medium hover:underline">
          חזרה למסך התלמידים
        </Link>
      }
    >
      <div className="text-center mb-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          כניסה למערכת ישיבת הדרום באמצעות חשבון Google בלבד.<br />
          רב חדש יקבל סטטוס "ממתין לאישור" עד לאישור המנהל.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      <Button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full h-12 font-medium bg-white text-foreground border border-border hover:bg-secondary"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 ml-2" />
        )}
        כניסה באמצעות Google
      </Button>

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

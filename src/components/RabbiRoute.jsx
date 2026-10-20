import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import UserAccessScreen from "@/components/UserAccessScreen";

export default function RabbiRoute({ children }) {
  const { user, isAuthenticated, authChecked, isLoadingAuth, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authChecked || isLoadingAuth) return;
    if (!isAuthenticated || !user) { setLoading(false); return; }
    (async () => {
      try {
        const res = await base44.functions.invoke("requestRabbiAccess", {});
        setData(res?.data || res);
      } catch (e) {
        setData({ status: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [authChecked, isLoadingAuth, isAuthenticated, user, refreshKey]);

  if (isLoadingAuth || !authChecked || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (data?.status === "admin") {
    // אם המשתמש הרגע קודם למנהל, נדרשת טעינה מחדש כדי לרענן את עצם המשתמש
    if (data.just_promoted) {
      window.location.href = `${import.meta.env.BASE_URL}admin`;
      return null;
    }
    return <Navigate to="/admin" replace />;
  }

  if (data?.status === "approved") {
    return children;
  }

  return (
    <UserAccessScreen
      data={data}
      onRefresh={() => { setLoading(true); setRefreshKey(k => k + 1); }}
      onLogout={() => logout()}
    />
  );
}

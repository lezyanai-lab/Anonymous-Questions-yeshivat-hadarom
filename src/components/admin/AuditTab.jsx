import { useState, useEffect, useCallback } from "react";
import { ScrollText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ACTION_LABELS = {
  approve_rabbi: "אישור רב",
  reject_rabbi: "דחיית רב",
  revoke_rabbi: "ביטול הרשאת רב",
  reactivate_rabbi: "הפעלת רב מחדש",
  grant_admin: "הענקת מנהל",
  transfer_ownership: "העברת הניהול הראשי",
  revoke_admin: "ביטול מנהל",
  toggle_rabbi_login: "שינוי כפתור כניסת רבנים",
};

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export default function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.AuditLog.filter({}, { sort: "-created_date", limit: 50 });
      setLogs(items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-3">
          <ScrollText className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">אין אירועים מתועדים עדיין</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">{ACTION_LABELS[log.action] || log.action}</p>
              <span className="text-xs text-muted-foreground">{formatDate(log.created_date)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {log.target_email && <span>נבצע על: {log.target_email} · </span>}
              על ידי: {log.performed_by_email}
            </p>
            {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

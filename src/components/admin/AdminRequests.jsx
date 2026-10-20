import { useState, useEffect, useCallback } from "react";
import { Shield, Check, X, Loader2, Mail, User, ShieldX, Info, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function AdminRequests({ isMainAdmin, onChanged }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.AccessRequest.filter(
        { request_type: "admin" },
        { sort: "-created_date", limit: 100 }
      );
      setRequests(items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (req, action) => {
    setActing(req.id);
    try {
      const res = await base44.functions.invoke("manageAdmin", { request_id: req.id, action });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success(action === "approve" ? "הוענקה גישת מנהל" : action === "reject" ? "הבקשה נדחתה" : "גישת המנהל בוטלה");
      load();
      onChanged?.();
    } catch (e) {
      toast.error("הפעולה נכשלה");
    } finally { setActing(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  }

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");

  return (
    <div className="space-y-5">
      {!isMainAdmin && (
        <div className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>רק המנהל הראשי יכול לאשר ולבטל מנהלים. ניתן לצפות בבקשות אך לא לפעול.</p>
        </div>
      )}

      {/* Pending */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> בקשות ממתינות ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">אין בקשות מנהל ממתינות</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-foreground">{r.entered_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {r.google_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(r.created_date)}</p>
                  </div>
                  {isMainAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" disabled={acting === r.id} onClick={() => handleAction(r, "approve")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {acting === r.id ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Check className="w-4 h-4 ml-1.5" />}
                        אשר
                      </Button>
                      <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => handleAction(r, "reject")}>
                        {acting === r.id ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <X className="w-4 h-4 ml-1.5" />}
                        דחה
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approved (can revoke) */}
      {approved.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" /> מנהלים פעילים שאושרו דרך המערכת ({approved.length})
          </h2>
          <div className="space-y-3">
            {approved.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-foreground">{r.entered_name}</p>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">מנהל</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {r.google_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">אושר על ידי {r.decided_by_email} · {formatDate(r.decided_date)}</p>
                  </div>
                  {isMainAdmin && (
                    <Button size="sm" variant="outline" disabled={acting === r.id} onClick={() => handleAction(r, "revoke")} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      {acting === r.id ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <ShieldX className="w-4 h-4 ml-1.5" />}
                      בטל הרשאה
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

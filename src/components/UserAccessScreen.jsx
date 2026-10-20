import { useState } from "react";
import { User, Shield, Clock, ShieldCheck, ShieldX, Loader2, LogOut, Mail, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function UserAccessScreen({ data, onRefresh, onLogout }) {
  const [name, setName] = useState(data?.display_name || "");
  const [savingName, setSavingName] = useState(false);
  const [requesting, setRequesting] = useState(null);

  const handleSaveName = async () => {
    if (!name.trim() || name.trim().length < 2) { toast.error("נא להזין שם תקין (לפחות 2 תווים)"); return; }
    setSavingName(true);
    try {
      const res = await base44.functions.invoke("saveUserName", { display_name: name.trim() });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success("השם נשמר");
      onRefresh();
    } catch (e) { toast.error("שמירת השם נכשלה"); }
    finally { setSavingName(false); }
  };

  const handleRequest = async (type) => {
    setRequesting(type);
    try {
      const res = await base44.functions.invoke("requestAccess", { request_type: type });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success(type === "rabbi" ? "בקשת גישת רב נשלחה למנהל" : "בקשת גישת מנהל נשלחה למנהל הראשי");
      onRefresh();
    } catch (e) { toast.error("שליחת הבקשה נכשלה"); }
    finally { setRequesting(null); }
  };

  const has_name = data?.has_name;
  const rabbiStatus = data?.rabbi_request?.status;
  const adminStatus = data?.admin_request?.status;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/40 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-primary-foreground font-bold text-2xl">יה</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">ישיבת הדרום</h1>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          {!has_name ? (
            <div>
              <h2 className="font-semibold text-foreground mb-1">שלום, נא להזין את שמך</h2>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                השם יוצג למנהל הישיבה לצורך אישור וקישור לרב. זהות חשבון ה-Google שלך נשמרת בנפרד.
              </p>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12" placeholder="שם מלא" onKeyDown={(e) => e.key === "Enter" && handleSaveName()} />
              <Button onClick={handleSaveName} disabled={savingName} className="w-full h-12 mt-3">
                {savingName ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                שמור שם
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{data.display_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" /> {data.google_email}
                  </p>
                </div>
              </div>

              {/* Rabbi access */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">גישת רב</h3>
                </div>
                {rabbiStatus === "pending" && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                    <Clock className="w-4 h-4 shrink-0" /> הבקשה ממתינה לאישור וקישור לרב על ידי המנהל
                  </div>
                )}
                {rabbiStatus === "rejected" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                      <ShieldX className="w-4 h-4 shrink-0" /> הבקשה נדחתה. ניתן לשלוח בקשה חדשה.
                    </div>
                    <Button variant="outline" size="sm" disabled={requesting === "rabbi"} onClick={() => handleRequest("rabbi")} className="w-full h-10">
                      {requesting === "rabbi" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Shield className="w-4 h-4 ml-2" />}
                      בקש גישת רב שוב
                    </Button>
                  </div>
                )}
                {!rabbiStatus && (
                  <Button variant="outline" disabled={requesting === "rabbi"} onClick={() => handleRequest("rabbi")} className="w-full h-11">
                    {requesting === "rabbi" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Shield className="w-4 h-4 ml-2" />}
                    בקש גישת רב
                  </Button>
                )}
              </div>

              {/* Admin access */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">גישת מנהל</h3>
                </div>
                {adminStatus === "pending" && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
                    <Clock className="w-4 h-4 shrink-0" /> הבקשה ממתינה לאישור המנהל הראשי
                  </div>
                )}
                {adminStatus === "rejected" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                      <ShieldX className="w-4 h-4 shrink-0" /> הבקשה נדחתה. ניתן לשלוח בקשה חדשה.
                    </div>
                    <Button variant="outline" size="sm" disabled={requesting === "admin"} onClick={() => handleRequest("admin")} className="w-full h-10">
                      {requesting === "admin" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 ml-2" />}
                      בקש גישת מנהל שוב
                    </Button>
                  </div>
                )}
                {!adminStatus && (
                  <Button variant="outline" disabled={requesting === "admin"} onClick={() => handleRequest("admin")} className="w-full h-11">
                    {requesting === "admin" ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 ml-2" />}
                    בקש גישת מנהל
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 ml-1.5" /> יציאה
          </Button>
        </div>
      </div>
    </div>
  );
}

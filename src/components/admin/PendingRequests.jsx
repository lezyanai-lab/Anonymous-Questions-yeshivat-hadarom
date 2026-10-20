import { useState, useEffect, useCallback } from "react";
import { UserCheck, Check, Link2, Plus, Loader2, Mail, Clock, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function PendingRequests({ onChanged }) {
  const [pending, setPending] = useState([]);
  const [rabbis, setRabbis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkDialog, setLinkDialog] = useState(null);
  const [acting, setActing] = useState(null);
  const [linkMode, setLinkMode] = useState("existing");
  const [selectedRabbi, setSelectedRabbi] = useState("");
  const [newRabbiName, setNewRabbiName] = useState("");
  const [newRabbiDesc, setNewRabbiDesc] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, rabbiRes] = await Promise.all([
        base44.entities.AccessRequest.filter(
          { request_type: "rabbi", status: "pending" },
          { sort: "created_date", limit: 100 }
        ),
        base44.entities.Rabbi.filter({}, { sort: "display_name", limit: 100 }),
      ]);
      setPending(reqRes.items || []);
      setRabbis(rabbiRes.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openLink = (req) => {
    setLinkDialog(req);
    setLinkMode("existing");
    setSelectedRabbi("");
    setNewRabbiName(req.entered_name || "");
    setNewRabbiDesc("");
  };

  const handleLink = async () => {
    if (!linkDialog) return;
    if (linkMode === "existing" && !selectedRabbi) { toast.error("נא לבחור רב"); return; }
    if (linkMode === "new" && !newRabbiName.trim()) { toast.error("נא להזין שם לרב"); return; }
    setActing(linkDialog.id);
    try {
      const payload = { request_id: linkDialog.id };
      if (linkMode === "existing") {
        payload.rabbi_id = selectedRabbi;
      } else {
        payload.display_name = newRabbiName.trim();
        payload.description = newRabbiDesc.trim();
      }
      const res = await base44.functions.invoke("linkRabbi", payload);
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success("החשבון קושר לרב ואושר");
      setLinkDialog(null);
      load();
      onChanged?.();
    } catch (e) { toast.error("הקישור נכשל"); }
    finally { setActing(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-3">
          <UserCheck className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">אין בקשות רבנים ממתינות</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">{pending.length} בקשות רבנים ממתינות לקישור ואישור</p>
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
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(r.created_date)}
              </p>
            </div>
            <Button size="sm" onClick={() => openLink(r)} className="shrink-0">
              <Link2 className="w-4 h-4 ml-1.5" />
              קשר לרב
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={!!linkDialog} onOpenChange={(o) => !o && setLinkDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>קישור חשבון לרב</DialogTitle>
          </DialogHeader>
          {linkDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                <p className="font-medium text-foreground">{linkDialog.entered_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" /> {linkDialog.google_email}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLinkMode("existing")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${linkMode === "existing" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                >
                  קשר לרב קיים
                </button>
                <button
                  onClick={() => setLinkMode("new")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${linkMode === "new" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                >
                  צור רב חדש
                </button>
              </div>

              {linkMode === "existing" ? (
                <div className="space-y-2">
                  <Label>בחר רב מהרשימה</Label>
                  <Select value={selectedRabbi} onValueChange={setSelectedRabbi}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="בחר רב..." /></SelectTrigger>
                    <SelectContent>
                      {rabbis.map(rb => (
                        <SelectItem key={rb.id} value={rb.id}>
                          {rb.display_name}{rb.email ? ` (${rb.email})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rabbis.length === 0 && <p className="text-xs text-muted-foreground">אין רבנים ברשימה — צור רב חדש.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>שם הרב המוצג לתלמידים</Label>
                    <Input value={newRabbiName} onChange={(e) => setNewRabbiName(e.target.value)} className="h-12" placeholder="הרב..." />
                  </div>
                  <div className="space-y-2">
                    <Label>תיאור קצר (לא חובה)</Label>
                    <Textarea value={newRabbiDesc} onChange={(e) => setNewRabbiDesc(e.target.value)} rows={2} />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLinkDialog(null)}>ביטול</Button>
            <Button onClick={handleLink} disabled={acting}>
              {acting ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Check className="w-4 h-4 ml-1.5" />}
              קשר ואשר
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Power, Trash2, Pencil, Mail, Search, Loader2, ShieldX, RotateCcw, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUS_LABELS = {
  approved: { label: "מאושר", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  revoked: { label: "הרשאה בוטלה", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  rejected: { label: "נדחה", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}

export default function RabbisManagement({ onChanged }) {
  const { user } = useAuth();
  const [rabbis, setRabbis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [acting, setActing] = useState(null);
  const [form, setForm] = useState({ display_name: "", description: "", email: "", password: "", active: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = { approval_status: { $ne: "pending" } };
      const trimmed = search.trim();
      if (trimmed) {
        query.$or = [
          { display_name: { $regex: trimmed, $options: "i" } },
          { email: { $regex: trimmed, $options: "i" } },
        ];
      }
      const { items } = await base44.entities.Rabbi.filter(query, { sort: "-created_date", limit: 100 });
      setRabbis(items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ display_name: "", description: "", email: "", password: "", active: true });
    setCreateOpen(true);
  };

  const openEdit = (rabbi) => {
    setEditing(rabbi);
    setForm({ display_name: rabbi.display_name, description: rabbi.description || "", email: rabbi.email || "", password: "", active: rabbi.active });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (!form.display_name.trim() || !form.email.trim()) { toast.error("נא למלא שם וכתובת מייל"); return; }
    if (!form.email.includes("@")) { toast.error("כתובת המייל אינה תקינה"); return; }
    if (!editing && form.password.length < 8) { toast.error("הסיסמה חייבת להכיל לפחות 8 תווים"); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editing) {
        await base44.entities.Rabbi.update(editing.id, {
          display_name: form.display_name.trim(),
          description: form.description.trim(),
          email: form.email.trim(),
          active: form.active,
        });
        toast.success("הרב עודכן");
      } else {
        await base44.functions.invoke("createRabbiAccount", {
          display_name: form.display_name.trim(),
          description: form.description.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        if (!form.active) {
          const { items } = await base44.entities.Rabbi.filter({ email: form.email.trim().toLowerCase() }, { limit: 1 });
          if (items?.[0]) await base44.entities.Rabbi.update(items[0].id, { active: false });
        }
        toast.success("הרב נוסף ואושר. אפשר למסור לו את המייל והסיסמה");
      }
      setCreateOpen(false);
      load();
      onChanged?.();
    } catch (e) { toast.error("השמירה נכשלה"); }
    finally { setSaving(false); }
  };

  const handleManage = async (rabbi, action) => {
    setActing(rabbi.id);
    try {
      const res = await base44.functions.invoke("manageRabbi", { rabbi_id: rabbi.id, action });
      if (res?.data?.error) { toast.error(res.data.error); return; }
      toast.success(action === "revoke" ? "הרשאת הרב בוטלה" : "הרב הופעל מחדש");
      load();
      onChanged?.();
    } catch (e) { toast.error("הפעולה נכשלה"); }
    finally { setActing(null); }
  };

  const handleDelete = async (rabbi) => {
    if (!confirm(`למחוק את "${rabbi.display_name}"?`)) return;
    try {
      await base44.entities.Rabbi.delete(rabbi.id);
      toast.success("הרב נמחק");
      load();
    } catch (e) { toast.error("המחיקה נכשלה"); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={openCreate} className="flex-1 h-12 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 ml-1.5" /> הוספת רב
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם או כתובת מייל..."
          className="pr-10 h-12"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
      ) : rabbis.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">אין רבנים מאושרים עדיין</p>
      ) : (
        <div className="space-y-3">
          {rabbis.map((r) => {
            const st = STATUS_LABELS[r.approval_status] || {};
            return (
              <div key={r.id} className={`rounded-2xl border bg-card p-4 ${r.approval_status === "approved" && r.active ? "border-border" : "border-border opacity-70"}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{r.display_name}</p>
                      {st.label && <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>}
                      {r.approval_status === "approved" && !r.active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">מוסתר מתלמידים</span>}
                    </div>
                    {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                    {r.email && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email}</p>}
                    {r.approved_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        אושר על ידי {r.approved_by_email || "—"} ב-{formatDate(r.approved_date)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title="עריכה"><Pencil className="w-4 h-4" /></Button>
                    {r.approval_status === "approved" && (
                      <Button size="icon" variant="ghost" disabled={acting === r.id} onClick={() => handleManage(r, "revoke")} title="ביטול הרשאה" className="text-destructive">
                        {acting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                      </Button>
                    )}
                    {r.approval_status === "revoked" && (
                      <Button size="icon" variant="ghost" disabled={acting === r.id} onClick={() => handleManage(r, "reactivate")} title="הפעלה מחדש" className="text-emerald-600">
                        {acting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} title="מחיקה" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "עריכת רב" : "הוספת רב מאושר"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם הרב המוצג לתלמידים</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="h-12" placeholder="הרב..." />
            </div>
            <div className="space-y-2">
              <Label>כתובת מייל של הרב</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12" placeholder="rabbi@gmail.com" dir="ltr" />
              <p className="text-xs text-muted-foreground">המייל ישמש לכניסה של הרב</p>
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>סיסמה לרב (לפחות 8 תווים)</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-12" dir="ltr" autoComplete="off" />
                <p className="text-xs text-muted-foreground">את המייל והסיסמה צריך למסור לרב בעצמך</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>תיאור קצר (לא חובה)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="לדוגמה: רב הישיבה, מומחה ל..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">פעיל (מוצג לתלמידים)</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />}
              {editing ? "שמור שינויים" : "הוסף ואשר"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

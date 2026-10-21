import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Visible to the main admin only. Hands the management of the site over to another Google account.
export default function TransferOwnership() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleTransfer = async () => {
    const target = email.trim();
    if (!target.includes("@")) { toast.error("נא להזין כתובת מייל תקינה"); return; }
    if (!confirm(`להעביר את הניהול הראשי אל ${target}?\nאחרי ההעברה לא תהיה לך יותר גישת מנהל.`)) return;
    setBusy(true);
    try {
      await base44.functions.invoke("transferOwnership", { email: target });
      toast.success("הניהול הועבר");
      window.location.href = import.meta.env.BASE_URL;
    } catch (e) {
      toast.error(e?.response?.data?.error || "ההעברה נכשלה");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">העברת הניהול הראשי</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        רק את/ה מנהל/ת האתר. אפשר להעביר את הניהול לחשבון Google אחר — מרגע ההעברה הוא יהיה המנהל היחיד.
      </p>
      <div className="flex gap-2">
        <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="h-11" />
        <Button variant="outline" onClick={handleTransfer} disabled={busy || !email.trim()} className="h-11 shrink-0">
          {busy && <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />}
          העבר ניהול
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

// Lets an admin show or hide the "rabbi login" button on the students' home screen (applies to all visitors).
export default function SiteSettings({ onChanged }) {
  const [visible, setVisible] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.SiteConfig.filter({}, { limit: 1 });
        setVisible(items?.[0]?.show_rabbi_login === true);
      } catch (e) {
        toast.error("טעינת ההגדרה נכשלה");
      }
    })();
  }, []);

  const toggle = async () => {
    if (visible === null || saving) return;
    const next = !visible;
    setSaving(true);
    try {
      await base44.functions.invoke("setRabbiLoginVisible", { visible: next });
      setVisible(next);
      toast.success(next ? "הכפתור מוצג עכשיו במסך הראשי" : "הכפתור הוסתר מהמסך הראשי");
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.error || "השמירה נכשלה");
    } finally {
      setSaving(false);
    }
  };

  const Icon = visible ? Eye : EyeOff;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card border border-border px-4 py-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">כפתור "כניסת רבנים" במסך הראשי</p>
          <p className="text-xs text-muted-foreground">
            {visible === null ? "טוען..." : visible ? "מוצג כרגע לכל המבקרים" : "מוסתר כרגע. רבנים נכנסים רק כשתציג אותו"}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={visible === null || saving}
        className="shrink-0"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : visible ? "הסתר" : "הצג"}
      </Button>
    </div>
  );
}

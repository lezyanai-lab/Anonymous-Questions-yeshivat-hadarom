import { useState } from "react";
import { Calendar, Forward, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  "חדשה": "bg-blue-50 text-blue-700 border-blue-200",
  "בטיפול": "bg-amber-50 text-amber-700 border-amber-200",
  "הועברה": "bg-purple-50 text-purple-700 border-purple-200",
  "טופלה": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" }) +
      " · " + d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessageCard({ message, rabbis = [], onUpdated, showAssignedTo = false, assignedToName }) {
  const [updating, setUpdating] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [targetRabbiId, setTargetRabbiId] = useState("");
  const [error, setError] = useState("");

  const unread = message.is_read === false;

  const markAsRead = async () => {
    if (!unread) return;
    try {
      await base44.entities.Message.update(message.id, { is_read: true });
      onUpdated?.();
    } catch (e) {}
  };

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    setError("");
    try {
      await base44.entities.Message.update(message.id, { status: newStatus, is_read: newStatus !== "חדשה" });
      onUpdated?.();
    } catch (e) {
      setError("שגיאה בעדכון הסטטוס");
    } finally {
      setUpdating(false);
    }
  };

  const handleForward = async () => {
    if (!targetRabbiId) return;
    setForwarding(true);
    setError("");
    try {
      const res = await base44.functions.invoke("forwardMessage", {
        message_id: message.id,
        target_rabbi_id: targetRabbiId,
      });
      if (res?.data?.error) {
        setError(res.data.error);
        return;
      }
      setForwardOpen(false);
      setTargetRabbiId("");
      onUpdated?.();
    } catch (e) {
      setError(e?.response?.data?.error || "שגיאה בהעברת ההודעה");
    } finally {
      setForwarding(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-card p-4 sm:p-5 shadow-sm transition-all cursor-pointer hover:shadow-md ${unread ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
      onClick={markAsRead}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {unread && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[message.status] || "bg-muted text-muted-foreground border-border"}`}>
            {message.status}
          </span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(message.created_date)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
          {message.category}
        </span>
        {showAssignedTo && assignedToName && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {assignedToName}
          </span>
        )}
        {message.forwarded_from_email && (
          <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
            הועברה מרב אחר
          </span>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">
        {message.content}
      </p>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
        {message.status !== "בטיפול" && message.status !== "טופלה" && (
          <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus("בטיפול")}>
            {updating && <Loader2 className="w-4 h-4 ml-1.5 animate-spin" />}
            סמן כבטיפול
          </Button>
        )}
        {message.status !== "טופלה" && (
          <Button size="sm" disabled={updating} onClick={() => handleStatus("טופלה")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {updating ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1.5" />}
            סמן כטופלה
          </Button>
        )}
        {message.status !== "חדשה" && (
          <Button size="sm" variant="ghost" disabled={updating} onClick={() => handleStatus("חדשה")} className="text-muted-foreground">
            סמן כחדשה
          </Button>
        )}
        {rabbis.length > 0 && message.status !== "טופלה" && (
          <Button size="sm" variant="ghost" onClick={() => setForwardOpen(true)} className="text-muted-foreground">
            <Forward className="w-4 h-4 ml-1.5" />
            העבר לרב אחר
          </Button>
        )}
      </div>

      <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>העברת ההודעה לרב אחר</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            הרב שייבחר יקבל גישה להודעה, והיא תוסר מרשימת ההודעות שלך.
          </p>
          <Select value={targetRabbiId} onValueChange={setTargetRabbiId}>
            <SelectTrigger className="h-12"><SelectValue placeholder="בחר רב מאושר" /></SelectTrigger>
            <SelectContent>
              {rabbis.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setForwardOpen(false); setError(""); }}>ביטול</Button>
            <Button onClick={handleForward} disabled={!targetRabbiId || forwarding}>
              {forwarding ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Forward className="w-4 h-4 ml-1.5" />}
              העבר הודעה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

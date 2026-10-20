import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MessageCard from "@/components/MessageCard";

export default function MessagesTab({ onChanged }) {
  const [messages, setMessages] = useState([]);
  const [rabbis, setRabbis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, rabbiRes] = await Promise.all([
        base44.entities.Message.filter({}, { sort: "-created_date", limit: 50 }),
        base44.entities.Rabbi.filter({ approval_status: "approved", active: true }, { limit: 100 }),
      ]);
      setMessages(msgRes.items || []);
      setRabbis(rabbiRes.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const rabbiNameByEmail = (email) => {
    const r = rabbis.find(r => r.email === email);
    return r ? r.display_name : email || "—";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-3">
          <MessageSquare className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">אין הודעות במערכת</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => (
        <MessageCard
          key={m.id}
          message={m}
          rabbis={rabbis}
          onUpdated={() => { setRefreshKey(k => k + 1); onChanged?.(); }}
          showAssignedTo
          assignedToName={rabbiNameByEmail(m.assigned_to_email)}
        />
      ))}
    </div>
  );
}

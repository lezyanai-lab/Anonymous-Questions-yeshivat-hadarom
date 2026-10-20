import { useState, useEffect, useCallback } from "react";
import { Inbox, Loader2, MessageSquare, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "@/components/AppHeader";
import MessageCard from "@/components/MessageCard";

const STATUS_TABS = ["הכל", "חדשה", "בטיפול", "הועברה", "טופלה"];

export default function RabbiDashboard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [rabbis, setRabbis] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("הכל");
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const query = { assigned_to_email: user.email };
      if (activeTab !== "הכל") query.status = activeTab;
      const [msgRes, rabbiRes, count] = await Promise.all([
        base44.entities.Message.filter(query, { sort: "-created_date", limit: 50 }),
        base44.entities.Rabbi.filter({ approval_status: "approved", active: true }, { limit: 100 }),
        base44.entities.Message.count({ assigned_to_email: user.email, is_read: { $ne: true } }),
      ]);
      setMessages(msgRes.items || []);
      setRabbis(rabbiRes.items || []);
      setUnreadCount(count || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // רענון אוטומטי בזמן-אמת
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe(() => setRefreshKey(k => k + 1));
    return unsub;
  }, []);

  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="אזור הרבנים" subtitle="תיבת הודעות" icon={Inbox} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Unread banner */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-5">
            <Bell className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">
              {unreadCount} {unreadCount === 1 ? "הודעה חדשה" : "הודעות חדשות"} ממתינות לקריאה
            </p>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary mb-3">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">אין הודעות בקטגוריה זו</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageCard key={m.id} message={m} rabbis={rabbis} onUpdated={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Settings, Users, MessageSquare, UserCheck, ScrollText, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AppHeader from "@/components/AppHeader";
import PendingRequests from "@/components/admin/PendingRequests";
import RabbisManagement from "@/components/admin/RabbisManagement";
import MessagesTab from "@/components/admin/MessagesTab";
import AuditTab from "@/components/admin/AuditTab";

const TABS = [
  { key: "pending", label: "בקשות רבנים", icon: UserCheck },
  { key: "rabbis", label: "רבנים", icon: Users },
  { key: "messages", label: "הודעות", icon: MessageSquare },
  { key: "audit", label: "יומן אירועים", icon: ScrollText },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.Settings.filter({}, { limit: 1 });
        if (items?.length > 0) {
          setOwnerEmail(items[0].owner_email);
          setIsMainAdmin(items[0].owner_email === user?.email);
        }
      } catch (e) {}
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="אזור הניהול" subtitle={isMainAdmin ? "מנהל ראשי" : "מנהל"} icon={Settings} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {isMainAdmin && ownerEmail && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-2.5 mb-4 text-sm">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">המנהל הראשי (בעל האפליקציה):</span>
            <span className="font-semibold text-foreground break-all">{ownerEmail}</span>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
        {tab === "pending" && <PendingRequests onChanged={refresh} />}
        {tab === "rabbis" && <RabbisManagement onChanged={refresh} />}
        {tab === "messages" && <MessagesTab onChanged={refresh} />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}

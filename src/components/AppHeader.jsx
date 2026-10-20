import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function AppHeader({ title, subtitle, icon: Icon }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout(false);
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
            <p className="text-xs text-muted-foreground truncate">{subtitle ? `${subtitle} · ישיבת הדרום` : "ישיבת הדרום"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <span className="hidden sm:inline text-sm text-muted-foreground">{user.email}</span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 ml-1.5" />
            יציאה
          </Button>
        </div>
      </div>
    </header>
  );
}

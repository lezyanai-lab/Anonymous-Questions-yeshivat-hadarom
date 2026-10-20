import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

export default function InstallButton() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || isStandalone()) return null;

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  if (deferred) {
    return (
      <Button onClick={install} className="w-full sm:w-auto h-11 text-sm">
        <Download className="w-4 h-4 ml-2" />
        התקנת האפליקציה
      </Button>
    );
  }

  if (isIos()) {
    return (
      <div className="w-full sm:w-auto text-center">
        <Button variant="outline" onClick={() => setShowIosHelp((v) => !v)} className="w-full sm:w-auto h-11 text-sm">
          <Download className="w-4 h-4 ml-2" />
          התקנת האפליקציה
        </Button>
        {showIosHelp && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            בספארי: לוחצים על <Share className="inline w-3.5 h-3.5 mx-0.5" /> (שיתוף) ובוחרים
            "הוסף למסך הבית".
          </p>
        )}
      </div>
    );
  }

  return null;
}

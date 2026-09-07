import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-600 animate-slide-up">
      <WifiOff size={16} />
      You're offline. Practice still works — progress syncs when you're back.
    </div>
  );
}

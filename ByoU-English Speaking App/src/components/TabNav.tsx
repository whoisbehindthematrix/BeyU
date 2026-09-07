import { Home, Mic, Trophy, User } from "lucide-react";

export type Tab = "home" | "practice" | "rewards" | "profile";

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "practice", label: "Practice", icon: Mic },
  { id: "rewards", label: "Rewards", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-ink-100 bg-surface-0/95 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="tap-target relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-all"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors ${
                  isActive ? "text-brand-500" : "text-ink-400"
                }`}
              />
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isActive ? "text-brand-500" : "text-ink-400"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

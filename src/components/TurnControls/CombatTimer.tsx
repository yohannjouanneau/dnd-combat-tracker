import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause } from "lucide-react";

type Props = {
  onRunningChange?: (isRunning: boolean) => void;
};

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function CombatTimer({ onRunningChange }: Props) {
  const { t } = useTranslation("combat");
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  useEffect(() => {
    if (!isRunning) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRunning]);

  const toggleTimer = () => setIsRunning((prev) => !prev);

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="font-mono text-lg md:text-xl font-bold text-text-primary tabular-nums tracking-widest">
        {formatTime(seconds)}
      </span>
      <button
        onClick={toggleTimer}
        className={`p-2 rounded transition ${
          isRunning
            ? "bg-red-600 active:bg-red-700 md:hover:bg-red-700 text-white"
            : "bg-panel-secondary active:bg-panel-secondary/80 md:hover:bg-panel-secondary/80 text-text-primary"
        }`}
        title={isRunning ? t("combat:timer.stop") : t("combat:timer.start")}
      >
        {isRunning ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

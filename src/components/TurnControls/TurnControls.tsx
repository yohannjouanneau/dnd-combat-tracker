import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import FocusModeToggle from "./FocusModeToggle";

type Props = {
  round: number;
  currentTurn: number;
  isFocusMode: boolean;
  combatantCount: number;
  onPrev: () => void;
  onNext: () => void;
  onToggleFocus: () => void;
  onOpenAddModal: () => void;
};

export default function TurnControls({
  round,
  currentTurn,
  isFocusMode,
  combatantCount,
  onPrev,
  onNext,
  onToggleFocus,
  onOpenAddModal,
}: Props) {
  const { t } = useTranslation("combat");
  const isAtStart = round === 1 && currentTurn === 0;
  const roundCountText =
    combatantCount > 0
      ? t("combat:turn.round", { number: round })
      : t("combat:turn.notStarted", { number: round });
  return (
    <div className="bg-panel-bg rounded-lg p-3 md:p-4 mb-3 border border-border-primary flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
      <div className="text-xl md:text-2xl font-bold text-center md:text-left">
        {roundCountText}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={isAtStart || combatantCount === 0}
          className={`flex-1 md:flex-none px-3 md:px-4 py-3 md:py-2 rounded transition text-sm md:text-base ${
            isAtStart || combatantCount === 0
              ? "bg-panel-secondary text-text-muted cursor-not-allowed opacity-50"
              : "bg-panel-secondary active:bg-panel-secondary/80 md:hover:bg-panel-secondary/80 text-text-primary"
          }`}
          title={t("combat:turn.previous")}
        >
          <span className="hidden sm:inline">{t("combat:turn.previous")}</span>
          <span className="sm:hidden">{t("combat:turn.previousShort")}</span>
        </button>
        <button
          onClick={onNext}
          disabled={combatantCount === 0}
          className={`flex-1 md:flex-none px-3 md:px-4 py-3 md:py-2 rounded transition text-sm md:text-base bg-green-600 active:bg-green-700 md:hover:bg-green-700 text-white ${
            combatantCount === 0
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
          title={t("combat:turn.next")}
        >
          <span className="hidden sm:inline">{t("combat:turn.next")}</span>
          <span className="sm:hidden">{t("combat:turn.nextShort")}</span>
        </button>
        <button
          onClick={onOpenAddModal}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 md:py-2 rounded transition flex items-center justify-center"
          title={t("combat:turn.addToFight")}
        >
          <Plus className="w-5 h-5" />
        </button>
        <FocusModeToggle isFocusMode={isFocusMode} onToggle={onToggleFocus} />
      </div>
    </div>
  );
}

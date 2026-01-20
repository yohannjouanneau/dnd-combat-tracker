import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { Combatant, DeathSaves } from "../../types";
import HpBar from "./HpBar";
import DeathSavesComp from "./DeathSaves";
import ConditionsList from "./ConditionsList";
import { Shield, Trash2, ExternalLink, Eye } from "lucide-react";
import CombatantAvatar from "../common/CombatantAvatar";
import { HP_BAR_ID_PREFIX } from "../../constants";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";

type Props = {
  combatant: Combatant;
  isActive: boolean;
  isSelected?: boolean;
  showEyeButton?: boolean;
  shouldScroll: boolean;
  onScrollComplete: () => void;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
  onShowDetail?: () => void;
  isQuickButtonsOpen?: boolean;
  onToggleQuickButtons?: (id: number) => void;
};

export default function CombatantCard({
  combatant,
  isActive,
  isSelected = false,
  showEyeButton = false,
  shouldScroll,
  onScrollComplete,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleCondition,
  onUpdateInitiative,
  onShowDetail,
  isQuickButtonsOpen,
  onToggleQuickButtons,
}: Props) {

  const { t } = useTranslation(["combat", "common"]);

  const confirmDialog = useConfirmationDialog();
  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("common:confirmation.removeCombatant.title"),
      message: t("common:confirmation.removeCombatant.message", {
        name: combatant.displayName,
      }),
    });
    if (isConfirmed) {
      onRemove(combatant.id);
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditingInit, setIsEditingInit] = useState(false);
  const [initValue, setInitValue] = useState(combatant.initiative.toString());
  const isDying = combatant.hp === 0;

  // Scroll into view only when explicitly requested
  useEffect(() => {
    if (shouldScroll && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      onScrollComplete();
    }
  }, [shouldScroll, onScrollComplete]);

  // Auto-select text when entering edit mode
  useEffect(() => {
    if (isEditingInit && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditingInit]);

  // Update local state when combatant initiative changes
  useEffect(() => {
    setInitValue(combatant.initiative.toString());
  }, [combatant.initiative]);

  const handleToggleQuickButtons = useCallback(() => {
    onToggleQuickButtons?.(combatant.id);
  }, [onToggleQuickButtons, combatant.id]);

  const handleStartEdit = () => {
    setIsEditingInit(true);
  };

  const handleSave = () => {
    const newInit = parseFloat(initValue);
    if (!isNaN(newInit) && newInit !== combatant.initiative) {
      onUpdateInitiative(combatant.id, newInit);
    } else {
      // Revert to original if invalid or unchanged
      setInitValue(combatant.initiative.toString());
    }
    setIsEditingInit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setInitValue(combatant.initiative.toString());
      setIsEditingInit(false);
    }
  };

  // Selection visual only shows when selected but NOT active (active takes priority)
  const showSelectionVisual = isSelected && !isActive;

  return (
    <div
      ref={cardRef}
      className={`bg-panel-bg rounded-lg p-4 md:p-6 border-2 transition ${
        isActive
          ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
          : showSelectionVisual
          ? "border-selection shadow-lg shadow-selection/20"
          : "border-border-primary"
      }`}
      style={{ borderLeftWidth: "6px", borderLeftColor: combatant.color }}
    >
      <div className="flex items-start gap-3 md:gap-4 mb-4">
        <div>
          <CombatantAvatar
            imageUrl={combatant.imageUrl}
            name={combatant.displayName}
            color={combatant.color}
            size="md"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                {isEditingInit ? (
                  <input
                    ref={inputRef}
                    type="number"
                    value={initValue}
                    onChange={(e) => setInitValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="text-2xl md:text-3xl font-bold text-text-muted bg-input-bg border-2 border-border-secondary rounded px-2 w-16 md:w-20 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => {
                      handleStartEdit();
                    }}
                    className="text-2xl md:text-3xl font-bold text-text-muted cursor-pointer hover:text-text-muted/80 hover:bg-blue-900/20 rounded px-2 transition-colors select-none"
                    title={t("combat:combatant.editInitiative")}
                  >
                    {combatant.initiative}
                  </div>
                )}

                <h3 className="text-lg md:text-2xl font-bold flex items-center gap-2 truncate">
                  <span className="truncate">{combatant.displayName}</span>
                  {isActive && (
                    <span className="text-yellow-500 text-xs md:text-sm flex-shrink-0">
                      ({t("combat:combatant.active")})
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex flex-wrap gap-x-3 md:gap-x-4 gap-y-1 text-xs md:text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <span className="truncate">{combatant.name}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                  {t("combat:combatant.ac")} {combatant.ac}
                </div>
                {combatant.externalResourceUrl && (
                  <a
                    href={combatant.externalResourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition flex-shrink-0"
                    title="Open external resource"
                  >
                    <ExternalLink className="w-3 h-3 md:w-5 md:h-5" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {showEyeButton && onShowDetail && (
                <button
                  onClick={() => {
                    onShowDetail();
                  }}
                  className={`transition flex-shrink-0 p-1 ${
                    isSelected
                      ? "text-selection hover:text-selection/60"
                      : "text-text-secondary hover:text-text-secondary/60"
                  }`}
                  title="View details"
                >
                  <Eye className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => {
                  confirmRemove();
                }}
                className="text-red-500 hover:text-red-400 transition flex-shrink-0 p-1"
                title={t("combat:combatant.remove")}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <HpBar
          inputId={`${HP_BAR_ID_PREFIX}${combatant.id}`}
          hp={combatant.hp ?? 0}
          maxHp={combatant.maxHp ?? 0}
          isActive={isActive}
          onDelta={(d) => onDeltaHp(combatant.id, d)}
          isQuickButtonsOpen={isQuickButtonsOpen}
          onToggleQuickButtons={handleToggleQuickButtons}
        />
      </div>
      {isDying && (
        <div>
          <DeathSavesComp
            value={combatant.deathSaves}
            onChange={(type, value) => onDeathSaves(combatant.id, type, value)}
          />
        </div>
      )}
      <div>
        <ConditionsList
          activeConditions={combatant.conditions}
          onToggle={(c) => onToggleCondition(combatant.id, c)}
        />
      </div>
    </div>
  );
}

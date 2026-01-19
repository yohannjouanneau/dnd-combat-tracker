import { useState, useEffect, useCallback } from "react";
import type { Combatant, DeathSaves } from "../../types";
import CombatantsList from "../CombatantsList/CombatantsList";
import CombatantDetailPanel from "../CombatantDetailPanel/CombatantDetailPanel";

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  shouldScrollToActive: boolean;
  onClearScrollFlag: () => void;
  isFocusMode: boolean;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
  selectedCombatantId: number | null;
  onSelectCombatant: (id: number) => void;
  showDetail: boolean;
  onCloseDetail: () => void;
};

export default function MobileCombatLayout({
  combatants,
  currentTurn,
  shouldScrollToActive,
  onClearScrollFlag,
  isFocusMode,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleCondition,
  onUpdateInitiative,
  selectedCombatantId,
  onSelectCombatant,
  showDetail,
  onCloseDetail,
}: Props) {
  const [openQuickButtonsId, setOpenQuickButtonsId] = useState<number | null>(null);

  const selectedCombatant = selectedCombatantId !== null
    ? combatants.find(c => c.id === selectedCombatantId) ?? null
    : null;

  // Auto-close QuickButtons when turn changes
  useEffect(() => {
    setOpenQuickButtonsId(null);
  }, [currentTurn]);

  const handleToggleQuickButtons = useCallback((id: number) => {
    setOpenQuickButtonsId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="overflow-hidden h-full">
      <div
        className={`flex h-full transition-all duration-500 ease-in-out ${
          showDetail ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Slide 1: CombatantsList */}
        <div className="w-full flex-shrink-0 h-full">
          <CombatantsList
            combatants={combatants}
            currentTurn={currentTurn}
            shouldScrollToActive={shouldScrollToActive}
            onClearScrollFlag={onClearScrollFlag}
            onRemove={onRemove}
            onDeltaHp={onDeltaHp}
            onDeathSaves={onDeathSaves}
            onToggleCondition={onToggleCondition}
            onUpdateInitiative={onUpdateInitiative}
            isFocusMode={isFocusMode}
            openQuickButtonsId={openQuickButtonsId}
            onToggleQuickButtons={handleToggleQuickButtons}
            selectedCombatantId={selectedCombatantId}
            onSelectCombatant={onSelectCombatant}
          />
        </div>

        {/* Slide 2: Detail panel */}
        <div className="w-full flex-shrink-0 flex flex-col overflow-y-auto">
          {selectedCombatant && (
            <div className="my-auto w-full">
              <CombatantDetailPanel
                combatant={selectedCombatant}
                onClose={onCloseDetail}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

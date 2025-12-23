import { useState, useEffect, useCallback } from "react";
import type { Combatant, DeathSaves } from "../../types";
import CombatantsList from "../CombatantsList/CombatantsList";
import CombatantDetailPanel from "../CombatantDetailPanel/CombatantDetailPanel";

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  isFocusMode: boolean;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleConcentration: (id: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
};

export default function MobileCombatLayout({
  combatants,
  currentTurn,
  isFocusMode,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleConcentration,
  onToggleCondition,
  onUpdateInitiative,
}: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const [openQuickButtonsId, setOpenQuickButtonsId] = useState<number | null>(null);
  const activeCombatant = combatants[currentTurn] ?? null;

  // Auto-close detail when turn changes
  useEffect(() => {
    setShowDetail(false);
  }, [currentTurn]);

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
            onShowDetail={() => setShowDetail(true)}
            onRemove={onRemove}
            onDeltaHp={onDeltaHp}
            onDeathSaves={onDeathSaves}
            onToggleConcentration={onToggleConcentration}
            onToggleCondition={onToggleCondition}
            onUpdateInitiative={onUpdateInitiative}
            isFocusMode={isFocusMode}
            openQuickButtonsId={openQuickButtonsId}
            onToggleQuickButtons={handleToggleQuickButtons}
          />
        </div>

        {/* Slide 2: Detail panel */}
        <div className="w-full flex-shrink-0 flex flex-col overflow-y-auto">
          {activeCombatant && (
            <div className="my-auto w-full">
              <CombatantDetailPanel
                combatant={activeCombatant}
                onClose={() => setShowDetail(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

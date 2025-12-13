import { useState, useEffect } from "react";
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
  const activeCombatant = combatants[currentTurn] ?? null;

  // Auto-close detail when turn changes
  useEffect(() => {
    setShowDetail(false);
  }, [currentTurn]);

  return (
    <div className="md:hidden overflow-hidden">
      <div
        className={`flex transition-all duration-500 ease-in-out ${
          showDetail ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Slide 1: CombatantsList */}
        <div className="w-full flex-shrink-0">
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
          />
        </div>

        {/* Slide 2: Detail panel */}
        <div className="w-full flex-shrink-0">
          {activeCombatant && (
            <CombatantDetailPanel
              combatant={activeCombatant}
              onClose={() => setShowDetail(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import type { RefObject } from "react";
import type { Combatant, DeathSaves } from "../../types";
import CombatantsList from "../CombatantsList/CombatantsList";
import CombatantDetailPanel from "../CombatantDetailPanel/CombatantDetailPanel";

type Props = {
  combatListRef: RefObject<HTMLDivElement | null>;
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

export default function DesktopCombatLayout({
  combatListRef,
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
  const activeCombatant = combatants[currentTurn] ?? null;

  return (
    <div className="hidden md:flex gap-4">
      {/* Left side: CombatantsList */}
      <div className="flex-1">
        <CombatantsList
          combatListRef={combatListRef}
          combatants={combatants}
          currentTurn={currentTurn}
          onRemove={onRemove}
          onDeltaHp={onDeltaHp}
          onDeathSaves={onDeathSaves}
          onToggleConcentration={onToggleConcentration}
          onToggleCondition={onToggleCondition}
          onUpdateInitiative={onUpdateInitiative}
          isFocusMode={isFocusMode}
        />
      </div>

      {/* Right side: Detail panel or placeholder */}
      <div className="flex-1">
        {activeCombatant ? (
          <CombatantDetailPanel combatant={activeCombatant} />
        ) : (
          <div className="bg-slate-800 rounded-lg p-6 border-2 border-slate-700 flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center text-slate-400">
              <p className="text-lg">No active combatant</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

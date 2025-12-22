
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

export default function DesktopCombatLayout({
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
    <div className="flex gap-4">
      {/* Left side: CombatantsList */}
      <div className={activeCombatant && isFocusMode ? "flex-1" : "w-full"}>
        <CombatantsList
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

      {/* Right side: Detail panel - only render if active combatant exists AND in focus mode */}
      {activeCombatant && isFocusMode && (
        <div 
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 36px)' }}
        >
          <CombatantDetailPanel combatant={activeCombatant} />
        </div>
      )}
    </div>
  );
}

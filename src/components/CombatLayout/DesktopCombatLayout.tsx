
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
};

export default function DesktopCombatLayout({
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
}: Props) {
  const activeCombatant = combatants[currentTurn] ?? null;

  return (
    <div className="flex gap-4 h-full">
      {/* Left side: CombatantsList */}
      <div className={activeCombatant && isFocusMode ? "flex-1 h-full" : "w-full"}>
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
        />
      </div>

      {/* Right side: Detail panel - only render if active combatant exists AND in focus mode */}
      {activeCombatant && isFocusMode && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="my-auto w-full">
            <CombatantDetailPanel combatant={activeCombatant} />
          </div>
        </div>
      )}
    </div>
  );
}

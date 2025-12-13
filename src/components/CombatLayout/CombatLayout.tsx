import DesktopCombatLayout from "./DesktopCombatLayout";
import MobileCombatLayout from "./MobileCombatLayout";
import type { Combatant, DeathSaves } from "../../types";

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
export default function CombatLayout({
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
  return (
    <div>
      <DesktopCombatLayout
        combatants={combatants}
        currentTurn={currentTurn}
        isFocusMode={isFocusMode}
        onRemove={onRemove}
        onDeltaHp={onDeltaHp}
        onDeathSaves={onDeathSaves}
        onToggleConcentration={onToggleConcentration}
        onToggleCondition={onToggleCondition}
        onUpdateInitiative={onUpdateInitiative}
      />
      <MobileCombatLayout
        combatants={combatants}
        currentTurn={currentTurn}
        isFocusMode={isFocusMode}
        onRemove={onRemove}
        onDeltaHp={onDeltaHp}
        onDeathSaves={onDeathSaves}
        onToggleConcentration={onToggleConcentration}
        onToggleCondition={onToggleCondition}
        onUpdateInitiative={onUpdateInitiative}
      />
    </div>
  );
}

import DesktopCombatLayout from "./DesktopCombatLayout";
import MobileCombatLayout from "./MobileCombatLayout";
import type { Combatant, DeathSaves } from "../../types";
import type { RefObject } from "react";

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
export default function CombatLayout({
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
  return (
    <div>
      <DesktopCombatLayout
        combatListRef={combatListRef}
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
        combatListRef={combatListRef}
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

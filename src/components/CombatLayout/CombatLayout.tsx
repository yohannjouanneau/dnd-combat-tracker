import DesktopCombatLayout from "./DesktopCombatLayout";
import MobileCombatLayout from "./MobileCombatLayout";
import type { Combatant, DeathSaves } from "../../types";
import { useMediaQuery } from "../../hooks/useMediaQuery";

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  isFocusMode: boolean;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
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
  onToggleCondition,
  onUpdateInitiative,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DesktopCombatLayout
        combatants={combatants}
        currentTurn={currentTurn}
        isFocusMode={isFocusMode}
        onRemove={onRemove}
        onDeltaHp={onDeltaHp}
        onDeathSaves={onDeathSaves}
        onToggleCondition={onToggleCondition}
        onUpdateInitiative={onUpdateInitiative}
      />
    );
  }

  return (
    <MobileCombatLayout
      combatants={combatants}
      currentTurn={currentTurn}
      isFocusMode={isFocusMode}
      onRemove={onRemove}
      onDeltaHp={onDeltaHp}
      onDeathSaves={onDeathSaves}
      onToggleCondition={onToggleCondition}
      onUpdateInitiative={onUpdateInitiative}
    />
  );
}

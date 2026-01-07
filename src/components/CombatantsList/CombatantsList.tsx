import type { Combatant, DeathSaves } from "../../types";
import CombatantCard from "./CombatantCard";

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
  onShowDetail?: () => void;
  isFocusMode?: boolean;
  openQuickButtonsId?: number | null;
  onToggleQuickButtons?: (id: number) => void;
};

export default function CombatantsList({
  combatants,
  currentTurn,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleCondition,
  onUpdateInitiative,
  onShowDetail,
  isFocusMode = false,
  openQuickButtonsId,
  onToggleQuickButtons,
}: Props) {
  return (
    <div
      className={`space-y-4 md:pr-2 scrollbar-thin scrollbar-thumb-border-secondary scrollbar-track-panel-bg ${
        isFocusMode ? "overflow-y-auto h-full" : ""
      }`}
    >
      {combatants.map((c, index) => (
        <CombatantCard
          key={c.id}
          combatant={c}
          isActive={index === currentTurn}
          onRemove={onRemove}
          onDeltaHp={onDeltaHp}
          onDeathSaves={onDeathSaves}
          onToggleCondition={onToggleCondition}
          onUpdateInitiative={onUpdateInitiative}
          onShowDetail={onShowDetail}
          isQuickButtonsOpen={openQuickButtonsId === c.id}
          onToggleQuickButtons={onToggleQuickButtons}
        />
      ))}
    </div>
  );
}

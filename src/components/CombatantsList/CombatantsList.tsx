import type { Combatant, DeathSaves } from "../../types";
import CombatantCard from "./CombatantCard";

type Props = {
  combatants: Combatant[];
  currentTurn: number;
  shouldScrollToActive: boolean;
  onClearScrollFlag: () => void;
  onRemove: (id: number) => void;
  onDeltaHp: (id: number, delta: number) => void;
  onDeathSaves: (id: number, type: keyof DeathSaves, value: number) => void;
  onToggleCondition: (id: number, condition: string) => void;
  onUpdateInitiative: (id: number, newInitiative: number) => void;
  isFocusMode?: boolean;
  openQuickButtonsId?: number | null;
  onToggleQuickButtons?: (id: number) => void;
  selectedCombatantId?: number | null;
  onSelectCombatant?: (id: number) => void;
};

export default function CombatantsList({
  combatants,
  currentTurn,
  shouldScrollToActive,
  onClearScrollFlag,
  onRemove,
  onDeltaHp,
  onDeathSaves,
  onToggleCondition,
  onUpdateInitiative,
  isFocusMode = false,
  openQuickButtonsId,
  onToggleQuickButtons,
  selectedCombatantId,
  onSelectCombatant,
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
          isSelected={c.id === selectedCombatantId}
          showEyeButton={isFocusMode}
          shouldScroll={index === currentTurn && shouldScrollToActive}
          onScrollComplete={onClearScrollFlag}
          onRemove={onRemove}
          onDeltaHp={onDeltaHp}
          onDeathSaves={onDeathSaves}
          onToggleCondition={onToggleCondition}
          onUpdateInitiative={onUpdateInitiative}
          onShowDetail={onSelectCombatant ? () => onSelectCombatant(c.id) : undefined}
          isQuickButtonsOpen={openQuickButtonsId === c.id}
          onToggleQuickButtons={onToggleQuickButtons}
        />
      ))}
    </div>
  );
}

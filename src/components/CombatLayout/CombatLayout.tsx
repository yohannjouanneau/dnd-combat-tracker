import { useState, useEffect, useCallback } from "react";
import DesktopCombatLayout from "./DesktopCombatLayout";
import MobileCombatLayout from "./MobileCombatLayout";
import type { Combatant, DeathSaves } from "../../types";
import { useMediaQuery } from "../../hooks/useMediaQuery";

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
export default function CombatLayout({
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
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedCombatantId, setSelectedCombatantId] = useState<number | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const activeCombatant = combatants[currentTurn] ?? null;

  // Auto-select new active combatant when turn changes
  useEffect(() => {
    if (activeCombatant && isFocusMode) {
      setSelectedCombatantId(activeCombatant.id);
    }
    // Close mobile detail panel on turn change
    setShowMobileDetail(false);
  }, [currentTurn, activeCombatant, isFocusMode]);

  // Reset selection when focus mode is disabled
  useEffect(() => {
    if (!isFocusMode) {
      setSelectedCombatantId(null);
      setShowMobileDetail(false);
    }
  }, [isFocusMode]);

  const handleSelectCombatant = useCallback((id: number) => {
    setSelectedCombatantId(prev => prev === id ? null : id);
  }, []);

  const handleMobileSelectCombatant = useCallback((id: number) => {
    setSelectedCombatantId(id);
    setShowMobileDetail(true);
  }, []);

  const handleCloseMobileDetail = useCallback(() => {
    setShowMobileDetail(false);
  }, []);

  if (isDesktop) {
    return (
      <DesktopCombatLayout
        combatants={combatants}
        currentTurn={currentTurn}
        shouldScrollToActive={shouldScrollToActive}
        onClearScrollFlag={onClearScrollFlag}
        isFocusMode={isFocusMode}
        onRemove={onRemove}
        onDeltaHp={onDeltaHp}
        onDeathSaves={onDeathSaves}
        onToggleCondition={onToggleCondition}
        onUpdateInitiative={onUpdateInitiative}
        selectedCombatantId={selectedCombatantId}
        onSelectCombatant={handleSelectCombatant}
      />
    );
  }

  return (
    <MobileCombatLayout
      combatants={combatants}
      currentTurn={currentTurn}
      shouldScrollToActive={shouldScrollToActive}
      onClearScrollFlag={onClearScrollFlag}
      isFocusMode={isFocusMode}
      onRemove={onRemove}
      onDeltaHp={onDeltaHp}
      onDeathSaves={onDeathSaves}
      onToggleCondition={onToggleCondition}
      onUpdateInitiative={onUpdateInitiative}
      selectedCombatantId={selectedCombatantId}
      onSelectCombatant={handleMobileSelectCombatant}
      showDetail={showMobileDetail}
      onCloseDetail={handleCloseMobileDetail}
    />
  );
}

import { X, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InitiativeGroup, NewCombatant, SearchResult } from "../../types";
import AddCombatantForm from "./AddCombatantForm";

export type AddCombatantModalMode = "player" | "group" | "fight";

type ButtonType =
  | "fight"
  | "park"
  | "savePlayer"
  | "addToLibrary"
  | "addInitGroup";

type Props = {
  isOpen: boolean;
  mode: AddCombatantModalMode;
  onClose: () => void;
  newCombatant: NewCombatant;
  stagedFrom?: string;
  totalCount: number;
  addToFightChecked: boolean;
  onAddToFightChange: (checked: boolean) => void;
  addAnotherChecked: boolean;
  onAddAnotherChange: (checked: boolean) => void;
  onChange: (patch: Partial<NewCombatant>) => void;
  onSubmit: () => void;
  onAddGroup: () => void;
  onSaveAsPlayer: () => void;
  onAddInitiativeGroup: () => void;
  onRemoveInitiativeGroup: (id: string) => void;
  onUpdateInitiativeGroup: (
    id: string,
    patch: Partial<InitiativeGroup>
  ) => void;
  onSearchMonsters: (searchName: string) => Promise<SearchResult[]>;
  onSelectSearchResult: (searchResult: SearchResult) => void;
  onAddToLibrary: () => void;
  onOpenLibrary: () => void;
};

const BUTTON_MODE_MAP: Record<AddCombatantModalMode, ButtonType[]> = {
  player: ["savePlayer"],
  group: ["park", "addToLibrary", "addInitGroup"],
  fight: ["fight", "addToLibrary", "addInitGroup"],
};

export default function AddCombatantModal({
  isOpen,
  mode,
  onClose,
  newCombatant,
  stagedFrom,
  totalCount,
  addToFightChecked,
  onAddToFightChange,
  addAnotherChecked,
  onAddAnotherChange,
  onChange,
  onSubmit,
  onAddGroup,
  onSaveAsPlayer,
  onAddInitiativeGroup,
  onRemoveInitiativeGroup,
  onUpdateInitiativeGroup,
  onSearchMonsters,
  onSelectSearchResult,
  onAddToLibrary,
  onOpenLibrary,
}: Props) {
  const { t } = useTranslation("forms");

  if (!isOpen) return null;

  const visibleButtons = BUTTON_MODE_MAP[mode];
  const titleKey = newCombatant.name ? `${mode}-edit` : mode;
  const modalTitle = t(`forms:combatant.modalTitle.${titleKey}`);
  
  // Determine library button title based on template origin
  const hasMonsterTemplate = newCombatant.templateOrigin?.origin === "monster_library" && newCombatant.templateOrigin?.id;
  const libraryButtonTitle = hasMonsterTemplate 
    ? t("forms:combatant.actions.libraryWithTemplate")
    : t("forms:combatant.actions.library");

  return (
    <>
      {/* Backdrop */}
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-4xl w-full max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary">
            <h2 className="text-xl md:text-2xl font-bold text-text-primary">
              {modalTitle}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLibrary}
                className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded transition"
                title={libraryButtonTitle}
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 md:p-6">
            <AddCombatantForm
              newCombatant={newCombatant}
              stagedFrom={stagedFrom}
              totalCount={totalCount}
              visibleButtons={visibleButtons}
              disableInitiativeCount={mode === 'player'}
              addToFightChecked={addToFightChecked}
              onAddToFightChange={onAddToFightChange}
              addAnotherChecked={addAnotherChecked}
              onAddAnotherChange={onAddAnotherChange}
              onChange={onChange}
              onSubmit={onSubmit}
              onAddGroup={onAddGroup}
              onSaveAsPlayer={onSaveAsPlayer}
              onAddInitiativeGroup={onAddInitiativeGroup}
              onRemoveInitiativeGroup={onRemoveInitiativeGroup}
              onUpdateInitiativeGroup={onUpdateInitiativeGroup}
              onSearchMonsters={onSearchMonsters}
              onSelectSearchResult={onSelectSearchResult}
              onAddToLibrary={onAddToLibrary}
            />
          </div>
        </div>
      </div>
    </>
  );
}

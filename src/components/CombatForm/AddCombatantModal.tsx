import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { InitiativeGroup, NewCombatant, SearchResult } from "../../types";
import AddCombatantForm from "./AddCombatantForm";

export type AddCombatantModalMode = "player" | "group" | "fight";

type ButtonType = "fight" | "park" | "savePlayer" | "addToLibrary" | "addInitGroup";

type Props = {
  isOpen: boolean;
  mode: AddCombatantModalMode;
  onClose: () => void;
  value: NewCombatant;
  stagedFrom?: string;
  totalCount: number;
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
};

const BUTTON_MODE_MAP: Record<AddCombatantModalMode, ButtonType[]> = {
  player: ["savePlayer", "addToLibrary", "addInitGroup"],
  group: ["park", "addToLibrary", "addInitGroup"],
  fight: ["fight", "addToLibrary", "addInitGroup"]
};

export default function AddCombatantModal({
  isOpen,
  mode,
  onClose,
  value,
  stagedFrom,
  totalCount,
  onChange,
  onSubmit,
  onAddGroup,
  onSaveAsPlayer,
  onAddInitiativeGroup,
  onRemoveInitiativeGroup,
  onUpdateInitiativeGroup,
  onSearchMonsters,
  onSelectSearchResult,
  onAddToLibrary
}: Props) {
  const { t } = useTranslation("forms");

  if (!isOpen) return null;

  const visibleButtons = BUTTON_MODE_MAP[mode];
  const modalTitle = t(`forms:combatant.modalTitle.${mode}`);

  return (
    <>
      {/* Backdrop */}
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {modalTitle}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 md:p-6">
            <AddCombatantForm
              value={value}
              stagedFrom={stagedFrom}
              totalCount={totalCount}
              inModal={true}
              visibleButtons={visibleButtons}
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

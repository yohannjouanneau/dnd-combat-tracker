import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  ApiSearchMode,
  InitiativeGroup,
  NewCombatant,
  SearchResult,
} from "../../types";
import AddCombatantForm from "./AddCombatantForm";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { nextApiSearchMode } from "../../utils/utils";
import IconButton from "../common/IconButton";

export type AddCombatantModalMode = "group" | "fight";

type ButtonType = "fight" | "park" | "addToLibrary" | "addInitGroup";

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
  onAddInitiativeGroup: () => void;
  onRemoveInitiativeGroup: (id: string) => void;
  onUpdateInitiativeGroup: (
    id: string,
    patch: Partial<InitiativeGroup>,
  ) => void;
  onSearchMonsters: (searchName: string) => Promise<SearchResult[]>;
  onSelectSearchResult: (searchResult: SearchResult) => void;
  onAddToLibrary: () => void;
  onOpenLibrary: () => void;
  apiMode: ApiSearchMode;
  onCycleApiMode: () => void;
};

const BUTTON_MODE_MAP: Record<AddCombatantModalMode, ButtonType[]> = {
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
  onAddInitiativeGroup,
  onRemoveInitiativeGroup,
  onUpdateInitiativeGroup,
  onSearchMonsters,
  onSelectSearchResult,
  onAddToLibrary,
  onOpenLibrary,
  apiMode,
  onCycleApiMode,
}: Props) {
  const { t } = useTranslation("forms");

  const visibleButtons = BUTTON_MODE_MAP[mode];
  const titleKey = newCombatant.name ? `${mode}-edit` : mode;
  const modalTitle = t(`forms:combatant.modalTitle.${titleKey}`);

  const hasMonsterTemplate =
    newCombatant.templateOrigin?.origin === "monster_library" &&
    newCombatant.templateOrigin?.id;
  const nextApiMode = nextApiSearchMode(apiMode);
  const libraryButtonTitle = hasMonsterTemplate
    ? t("forms:combatant.actions.libraryWithTemplate")
    : t("forms:combatant.actions.library");

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCycleApiMode}
            title={t("forms:combatant.actions.switchApiMode", {
              mode: t(`forms:combatant.actions.apiMode.${nextApiMode}`),
            })}
          >
            {t(`forms:combatant.actions.apiMode.${apiMode}`)}
          </Button>
          <IconButton
            variant="filled"
            onClick={onOpenLibrary}
            title={libraryButtonTitle}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <BookOpen className="w-5 h-5" />
          </IconButton>
        </div>
      }
    >
      <Modal.Body>
        <AddCombatantForm
          newCombatant={newCombatant}
          stagedFrom={stagedFrom}
          totalCount={totalCount}
          visibleButtons={visibleButtons}
          disableInitiativeCount={false}
          addToFightChecked={addToFightChecked}
          onAddToFightChange={onAddToFightChange}
          addAnotherChecked={addAnotherChecked}
          onAddAnotherChange={onAddAnotherChange}
          onChange={onChange}
          onSubmit={onSubmit}
          onAddGroup={onAddGroup}
          onAddInitiativeGroup={onAddInitiativeGroup}
          onRemoveInitiativeGroup={onRemoveInitiativeGroup}
          onUpdateInitiativeGroup={onUpdateInitiativeGroup}
          onSearchMonsters={onSearchMonsters}
          onSelectSearchResult={onSelectSearchResult}
          onAddToLibrary={onAddToLibrary}
        />
      </Modal.Body>
    </Modal>
  );
}

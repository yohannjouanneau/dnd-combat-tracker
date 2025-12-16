import { useTranslation } from "react-i18next";
import type { InitiativeGroup, NewCombatant, SearchResult } from "../../types";
import LabeledTextInput from "../common/LabeledTextInput";
import LabeledNumberInput from "../common/LabeledNumberInput";
import ColorPicker from "../common/ColorPicker";
import InitiativeGroupInput from "./InitiativeGroupInput";
import {
  Save,
  Sword,
  CircleParking,
  Dice3,
} from "lucide-react";
import CombatantNameWithSearch from "./CombatantNameWithSearch";
import { isNewCombatantInvalid, safeParseInt } from "../../utils";

type ButtonType =
  | "fight"
  | "park"
  | "savePlayer"
  | "addToLibrary"
  | "addInitGroup";

type Props = {
  newCombatant: NewCombatant;
  stagedFrom?: string;
  totalCount: number;
  visibleButtons?: ButtonType[];
  addToFightChecked: boolean;
  disableInitiativeCount: boolean,
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
};

export default function AddCombatantForm({
  newCombatant,
  stagedFrom,
  totalCount,
  visibleButtons,
  disableInitiativeCount,
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
}: Props) {
  const { t } = useTranslation("forms");

  const isButtonVisible = (button: ButtonType) => {
    if (!visibleButtons) return true;
    return visibleButtons.includes(button);
  };

  const getLetterRange = () => {
    if (totalCount <= 1) return "";
    const lastLetter = String.fromCharCode(65 + totalCount - 1);
    return ` (A-${lastLetter})`;
  };

  const content = (
    <div>
      {stagedFrom && (
        <div className="mb-3 text-sm text-text-secondary">
          {t("forms:combatant.stagedFrom")}{" "}
          <span className="font-semibold">{stagedFrom}</span>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <CombatantNameWithSearch
          id="combatantName"
          label={t("forms:combatant.name")}
          value={newCombatant.name}
          placeholder={t("forms:combatant.groupNamePlaceholder")}
          onChange={(v) => onChange({ name: v })}
          onSearch={onSearchMonsters}
          onSelectResult={onSelectSearchResult}
        />
        <ColorPicker
          value={newCombatant.color}
          onChange={(v) => onChange({ color: v })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <LabeledTextInput
          id="combatImageUrl"
          label={t("forms:combatant.imageUrl")}
          value={newCombatant.imageUrl || ""}
          placeholder={t("forms:combatant.imageUrlPlaceholder")}
          onChange={(v) => onChange({ imageUrl: v })}
        />
        <LabeledTextInput
          id="externalResourceUrl"
          label={t("forms:combatant.externalResourceUrl")}
          value={newCombatant.externalResourceUrl || ""}
          placeholder={t("forms:combatant.externalResourceUrlPlacehoder")}
          onChange={(v) => onChange({ externalResourceUrl: v })}
        />
        <LabeledNumberInput
          id="combatHp"
          label={t("forms:combatant.currentHp")}
          value={newCombatant.hp ?? ""}
          placeholder={t("forms:combatant.currentHpPlaceholder")}
          onChange={(v) => onChange({ hp: safeParseInt(v) })}
        />
        <LabeledNumberInput
          id="combatMaxHp"
          label={t("forms:combatant.maxHp")}
          value={newCombatant.maxHp ?? ""}
          placeholder={t("forms:combatant.maxHpPlaceholder")}
          onChange={(v) => onChange({ maxHp: safeParseInt(v) })}
        />
        <LabeledNumberInput
          id="combatAc"
          label={t("forms:combatant.ac")}
          value={newCombatant.ac ?? ""}
          placeholder={t("forms:combatant.acPlaceholder")}
          onChange={(v) => onChange({ ac: safeParseInt(v) })}
        />

        <LabeledNumberInput
          id="initBonus"
          label={t("forms:combatant.initBonus")}
          value={newCombatant.initBonus ?? ""}
          placeholder={t("forms:combatant.initBonusPlaceholder")}
          onChange={(v) => onChange({ initBonus: safeParseInt(v, true) })}
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text-secondary">
            {t("forms:combatant.initiative")}
            {totalCount > 0 && (
              <span className="ml-2 text-blue-400 text-xs">
                {t("forms:combatant.initiativeHint", {
                  count: totalCount,
                  range: getLetterRange(),
                })}
              </span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {newCombatant.initiativeGroups.map((group, index) => (
            <InitiativeGroupInput
              key={group.id}
              group={group}
              index={index}
              initBonus={newCombatant.initBonus}
              canRemove={newCombatant.initiativeGroups.length > 1}
              disableCount={disableInitiativeCount}
              onChange={onUpdateInitiativeGroup}
              onRemove={onRemoveInitiativeGroup}
            />
          ))}
        </div>
      </div>

      {/* Add to Fight Checkbox - Only show in player/group modes */}
      {(isButtonVisible("savePlayer") || isButtonVisible("park")) && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={addToFightChecked}
              onChange={(e) => onAddToFightChange(e.target.checked)}
              className="w-4 h-4 rounded border-border-secondary bg-input-bg text-lime-600 focus:ring-lime-600 focus:ring-offset-panel-bg"
            />
            <span className="text-sm font-medium">
              {t("forms:combatant.addToFight")}
            </span>
          </label>
        </div>
      )}

      {/* Add Another Checkbox - Show in all modes */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={addAnotherChecked}
            onChange={(e) => onAddAnotherChange(e.target.checked)}
            className="w-4 h-4 rounded border-border-secondary bg-input-bg text-lime-600 focus:ring-lime-600 focus:ring-offset-panel-bg"
          />
          <span className="text-sm font-medium">
            {t("forms:combatant.addAnother")}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:flex gap-2 md:gap-3 mt-4">
        {isButtonVisible("fight") && (
          <button
            onClick={onSubmit}
            className="disabled:pointer-events-none disabled:opacity-50 bg-lime-600 hover:bg-lime-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
            title={t("forms:combatant.actions.fight")}
            disabled={isNewCombatantInvalid(newCombatant)}
          >
            <Sword className="w-5 h-5" />
            <span className="hidden md:inline">
              {t("forms:combatant.actions.fight")}
            </span>
          </button>
        )}
        {isButtonVisible("park") && (
          <button
            onClick={onAddGroup}
            className="disabled:pointer-events-none disabled:opacity-50 bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
            title={t("forms:combatant.actions.park")}
            disabled={isNewCombatantInvalid(newCombatant)}
          >
            <CircleParking className="w-5 h-5" />
            <span className="hidden md:inline">
              {t("forms:combatant.actions.park")}
            </span>
          </button>
        )}
        {isButtonVisible("savePlayer") && (
          <button
            onClick={onSaveAsPlayer}
            className="disabled:pointer-events-none disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
            title={t("forms:combatant.actions.savePlayer")}
            disabled={isNewCombatantInvalid(newCombatant)}
          >
            <Save className="w-5 h-5" />
            <span className="hidden md:inline">
              {t("forms:combatant.actions.savePlayer")}
            </span>
          </button>
        )}
        {isButtonVisible("addToLibrary") && (
          <button
            onClick={onAddToLibrary}
            className="disabled:pointer-events-none disabled:opacity-50 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
            title={t("forms:combatant.actions.addToLibrary")}
            disabled={isNewCombatantInvalid(newCombatant)}
          >
            <Save className="w-5 h-5" />
            <span className="hidden md:inline">
              {t("forms:combatant.actions.addToLibrary")}
            </span>
          </button>
        )}
        {isButtonVisible("addInitGroup") && (
          <button
            onClick={onAddInitiativeGroup}
            className="bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-4 py-3 rounded flex items-center justify-center gap-2 transition"
            title={t("forms:combatant.actions.addInitGroup")}
          >
            <Dice3 className="w-5 h-5" />
            <span className="hidden md:inline">
              {t("forms:combatant.actions.addInitGroup")}
            </span>
          </button>
        )}
      </div>
    </div>
  );

  return content;
}

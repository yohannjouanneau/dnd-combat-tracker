import { type RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { InitiativeGroup, NewCombatant, SearchResult } from "../../types";
import LabeledTextInput from "../common/LabeledTextInput";
import LabeledNumberInput from "../common/LabeledNumberInput";
import ColorPicker from "../common/ColorPicker";
import InitiativeGroupInput from "./InitiativeGroupInput";
import { ChevronDown, Save, Sword, CircleParking, Dice3, BookOpen } from "lucide-react";
import CombatantNameWithSearch from "./CombatantNameWithSearch";
import { isNewCombatantInvalid, safeParseInt } from "../../utils";

type ButtonType = "fight" | "park" | "savePlayer" | "addToLibrary" | "addInitGroup";

type Props = {
  formRef?: RefObject<HTMLDivElement | null>;
  value: NewCombatant;
  stagedFrom?: string;
  totalCount: number;
  isCollapsed?: boolean;
  isFightModeEnabled: boolean;
  inModal?: boolean;
  visibleButtons?: ButtonType[];
  onToggleCollapse?: (collapsed: boolean) => void;
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
  onAddToLibrary: () => void
};

export default function AddCombatantForm({
  formRef,
  value,
  stagedFrom,
  totalCount,
  isCollapsed = false,
  isFightModeEnabled,
  inModal = false,
  visibleButtons,
  onToggleCollapse,
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

  const isButtonVisible = (button: ButtonType) => {
    if (!visibleButtons) return true;
    return visibleButtons.includes(button);
  };

  const getLetterRange = () => {
    if (totalCount <= 1) return "";
    const lastLetter = String.fromCharCode(65 + totalCount - 1);
    return ` (A-${lastLetter})`;
  };

  const parkGroupButtonText = isFightModeEnabled
    ? t("forms:combatant.actions.parkAndFight")
    : t("forms:combatant.actions.park");

  const savePlayerButtonText = isFightModeEnabled
    ? t("forms:combatant.actions.savePlayerAndFight")
    : t("forms:combatant.actions.savePlayer");

  const content = (
    <div className={inModal ? "" : "px-6 pb-6"}>
          {stagedFrom && (
            <div className="mb-3 text-sm text-slate-300">
              {t("forms:combatant.stagedFrom")}{" "}
              <span className="font-semibold">{stagedFrom}</span>.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <CombatantNameWithSearch
              id="combatantName"
              label={t("forms:combatant.name")}
              value={value.name}
              placeholder={t("forms:combatant.groupNamePlaceholder")}
              onChange={(v) => onChange({ name: v })}
              onSearch={onSearchMonsters}
              onSelectResult={onSelectSearchResult}
            />
            <ColorPicker
              value={value.color}
              onChange={(v) => onChange({ color: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <LabeledTextInput
              id="combatImageUrl"
              label={t("forms:combatant.imageUrl")}
              value={value.imageUrl || ""}
              placeholder={t("forms:combatant.imageUrlPlaceholder")}
              onChange={(v) => onChange({ imageUrl: v })}
            />
            <LabeledTextInput
              id="externalResourceUrl"
              label={t("forms:combatant.externalResourceUrl")}
              value={value.externalResourceUrl || ""}
              placeholder={t("forms:combatant.externalResourceUrlPlacehoder")}
              onChange={(v) => onChange({ externalResourceUrl: v })}
            />
            <LabeledNumberInput
              id="combatHp"
              label={t("forms:combatant.currentHp")}
              value={value.hp ?? ""}
              placeholder={t("forms:combatant.currentHpPlaceholder")}
              onChange={(v) => onChange({ hp: safeParseInt(v) })}
            />
            <LabeledNumberInput
              id="combatMaxHp"
              label={t("forms:combatant.maxHp")}
              value={value.maxHp ?? ""}
              placeholder={t("forms:combatant.maxHpPlaceholder")}
              onChange={(v) => onChange({ maxHp: safeParseInt(v) })}
            />
            <LabeledNumberInput
              id="combatAc"
              label={t("forms:combatant.ac")}
              value={value.ac ?? ""}
              placeholder={t("forms:combatant.acPlaceholder")}
              onChange={(v) => onChange({ ac: safeParseInt(v) })}
            />

            <LabeledNumberInput
              id="initBonus"
              label={t("forms:combatant.initBonus")}
              value={value.initBonus ?? ""}
              placeholder={t("forms:combatant.initBonusPlaceholder")}
              onChange={(v) => onChange({ initBonus: safeParseInt(v, true) })}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
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
              {value.initiativeGroups.map((group, index) => (
                <InitiativeGroupInput
                  key={group.id}
                  group={group}
                  index={index}
                  initBonus={value.initBonus}
                  canRemove={value.initiativeGroups.length > 1}
                  onChange={onUpdateInitiativeGroup}
                  onRemove={onRemoveInitiativeGroup}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:flex gap-2 md:gap-3 mt-4">
            {isButtonVisible("fight") && (
              <button
                onClick={onSubmit}
                className="disabled:pointer-events-none disabled:opacity-50 bg-lime-600 hover:bg-lime-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
                title={t("forms:combatant.actions.fight")}
                disabled={isNewCombatantInvalid(value)}
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
                title={parkGroupButtonText}
                disabled={isNewCombatantInvalid(value)}
              >
                <CircleParking className="w-5 h-5" />
                <span className="hidden md:inline">{parkGroupButtonText}</span>
              </button>
            )}
            {isButtonVisible("savePlayer") && (
              <button
                onClick={onSaveAsPlayer}
                className="disabled:pointer-events-none disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
                title={savePlayerButtonText}
                disabled={isNewCombatantInvalid(value)}
              >
                <Save className="w-5 h-5" />
                <span className="hidden md:inline">{savePlayerButtonText}</span>
              </button>
            )}
            {isButtonVisible("addToLibrary") && (
              <button
                onClick={onAddToLibrary}
                className="disabled:pointer-events-none disabled:opacity-50 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
                title={t("forms:combatant.actions.addToLibrary")}
                disabled={isNewCombatantInvalid(value)}
              >
                <BookOpen className="w-5 h-5" />
                <span className="hidden md:inline">{t("forms:combatant.actions.addToLibrary")}</span>
              </button>
            )}
            {isButtonVisible("addInitGroup") && (
              <button
                onClick={onAddInitiativeGroup}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded flex items-center justify-center gap-2 transition"
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

  if (inModal) {
    return content;
  }

  return (
    <div
      ref={formRef}
      className="bg-slate-800 rounded-lg border border-slate-700 mb-6 overflow-hidden"
    >
      <button
        onClick={() => onToggleCollapse?.(! isCollapsed)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-700 transition-colors"
      >
        <h2 className="text-xl font-semibold">{t("forms:combatant.title")}</h2>
        <div
          className="transition-transform duration-300"
          style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </button>

      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: isCollapsed ? "0px" : "2000px",
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {content}
      </div>
    </div>
  );
}

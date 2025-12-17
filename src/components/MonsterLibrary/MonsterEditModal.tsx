import { X, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster, SearchResult } from "../../types";
import LabeledTextInput from "../common/LabeledTextInput";
import CombatantNameWithSearch from "../CombatForm/CombatantNameWithSearch";
import type { ApiMonster } from "../../api/types";
import { getStatModifier, getApiImageUrl, safeParseInt } from "../../utils/utils";
import { appendFormattedActions } from "../../utils/monsterNotes";
import { DEFAULT_COLOR_PRESET } from "../../constants";
import MarkdownEditor from "../common/mardown/MarkdownEditor";

type Props = {
  monster: SavedMonster;
  isCreating: boolean;
  onSave: (updated: SavedMonster) => void;
  onSearchMonsters: (searchName: string) => Promise<SearchResult[]>;
  onCancel: () => void;
};

export default function MonsterEditModal({
  monster,
  isCreating,
  onSave,
  onCancel,
  onSearchMonsters,
}: Props) {
  const { t } = useTranslation(["common", "forms"]);
  const [formData, setFormData] = useState(monster);

  const handleSave = () => {
    // Validation: ensure required fields are filled
    if (!formData.name.trim()) {
      alert(t("forms:library.edit.validation.nameRequired"));
      return;
    }
    onSave(formData);
  };

  const handleSearchResult = (searchResult: SearchResult) => {
    if (searchResult.source === "api") {
      const apiMonster = searchResult.monster as ApiMonster;
      console.log(`DEBUG ==> monster conditions`, apiMonster.condition_immunities);
      const libraryMonster: SavedMonster = {
        id: formData.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: "monster",
        name: apiMonster.name,
        hp: apiMonster.hit_points,
        maxHp: apiMonster.hit_points,
        ac: apiMonster.armor_class?.at(0)?.value ?? 0,
        initBonus: apiMonster.dexterity
          ? getStatModifier(apiMonster.dexterity)
          : undefined,
        externalResourceUrl: "",
        imageUrl: getApiImageUrl(apiMonster),
        color: DEFAULT_COLOR_PRESET[0].value,
        initiativeGroups: [],
        str: apiMonster.strength,
        dex: apiMonster.dexterity,
        con: apiMonster.constitution,
        int: apiMonster.intelligence,
        wis: apiMonster.wisdom,
        cha: apiMonster.charisma,
        notes: appendFormattedActions(formData.notes ?? "", apiMonster),
      };
      setFormData(libraryMonster);
    }
  };

  const title = isCreating
    ? t("forms:library.edit.title.create")
    : t("forms:library.edit.title.edit", { name: monster.name });

  const updateNotes = (notes: string) => {
    setFormData({ ...formData, notes: notes });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary sticky top-0 bg-panel-bg z-10">
            <h3 className="text-lg md:text-xl font-bold text-text-primary">{title}</h3>
            <button
              onClick={onCancel}
              className="text-text-muted hover:text-text-primary transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CombatantNameWithSearch
                id="combatantName"
                label={t("forms:combatant.name")}
                value={formData.name}
                placeholder={t("forms:library.edit.placeholders.name")}
                onChange={(v) => setFormData({ ...formData, name: v })}
                onSearch={onSearchMonsters}
                onSelectResult={handleSearchResult}
              />
              <LabeledTextInput
                id="edit-hp"
                label={t("forms:library.edit.fields.hp")}
                value={formData.hp?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, hp: safeParseInt(v) })
                }
                placeholder="50"
              />
              <LabeledTextInput
                id="edit-ac"
                label={t("forms:library.edit.fields.ac")}
                value={formData.ac?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, ac: safeParseInt(v) })
                }
                placeholder="15"
              />
              <LabeledTextInput
                id="edit-imageUrl"
                label={t("forms:library.edit.fields.imageUrl")}
                value={formData.imageUrl ?? ""}
                onChange={(v) => setFormData({ ...formData, imageUrl: v })}
                placeholder={t("forms:library.edit.placeholders.imageUrl")}
              />
              <LabeledTextInput
                id="edit-resouceUrl"
                label={t("forms:library.edit.fields.externalResourceUrl")}
                value={formData.externalResourceUrl ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, externalResourceUrl: v })
                }
                placeholder={t(
                  "forms:library.edit.placeholders.externalResourceUrl"
                )}
              />
            </div>

            {/* Ability Scores Label */}
            <div className="text-sm font-semibold text-text-secondary pt-2">
              {t("forms:library.edit.sections.abilityScores")}
            </div>

            {/* Ability Scores Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <LabeledTextInput
                id="edit-str"
                label={t("forms:library.edit.fields.str")}
                value={formData.str?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, str: safeParseInt(v) })
                }
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-dex"
                label={t("forms:library.edit.fields.dex")}
                value={formData.dex?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, dex: safeParseInt(v) })
                }
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-con"
                label={t("forms:library.edit.fields.con")}
                value={formData.con?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, con: safeParseInt(v) })
                }
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-int"
                label={t("forms:library.edit.fields.int")}
                value={formData.int?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, int: safeParseInt(v) })
                }
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-wis"
                label={t("forms:library.edit.fields.wis")}
                value={formData.wis?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, wis: safeParseInt(v) })
                }
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-cha"
                label={t("forms:library.edit.fields.cha")}
                value={formData.cha?.toString() ?? ""}
                onChange={(v) =>
                  setFormData({ ...formData, cha: safeParseInt(v) })
                }
                placeholder="10"
              />
            </div>
            <MarkdownEditor
              value={formData.notes ?? ""}
              onChange={updateNotes}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 md:p-6 border-t border-border-primary sticky bottom-0 bg-panel-bg">
            <button
              onClick={onCancel}
              className="flex-1 bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-4 py-2 rounded transition font-medium"
            >
              {t("common:actions.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreating
                ? t("common:actions.create")
                : t("common:actions.save")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

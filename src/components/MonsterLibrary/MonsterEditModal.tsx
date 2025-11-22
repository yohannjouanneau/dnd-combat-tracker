// src/components/MonsterLibrary/MonsterEditModal.tsx
import { X, Save } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedMonster } from "../../types";
import LabeledTextInput from "../common/LabeledTextInput";

type Props = {
  monster: SavedMonster;
  isCreating: boolean
  onSave: (updated: SavedMonster) => void;
  onCancel: () => void;
};

export default function MonsterEditModal({
  monster,
  isCreating,
  onSave,
  onCancel,
}: Props) {
  const { t } = useTranslation(["common"]);
  const [formData, setFormData] = useState(monster);

  const handleSave = () => {
    // Validation: ensure required fields are filled
    if (!formData.name.trim()) {
      alert("Monster name is required");
      return;
    }
    onSave(formData);
  };

  const title = isCreating
    ? "Create New Monster"
    : `Edit Monster: ${monster.name}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledTextInput
                id="edit-name"
                label="Name *"
                value={formData.name}
                onChange={(v) => setFormData({ ...formData, name: v })}
                placeholder="Monster Name"
              />
              <LabeledTextInput
                id="edit-imageUrl"
                label="Image URL"
                value={formData.imageUrl}
                onChange={(v) => setFormData({ ...formData, imageUrl: v })}
                placeholder="https://example.com/image.png"
              />
            </div>

            {/* HP & AC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LabeledTextInput
                id="edit-hp"
                label="Hit Points (HP)"
                value={formData.hp.toString()}
                onChange={(v) => setFormData({ ...formData, hp: parseInt(v)})}
                placeholder="50"
              />
              <LabeledTextInput
                id="edit-ac"
                label="Armor Class (AC)"
                value={formData.ac?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, ac: parseInt(v) })}
                placeholder="15"
              />
            </div>

            {/* Ability Scores Label */}
            <div className="text-sm font-semibold text-slate-300 pt-2">
              Ability Scores
            </div>

            {/* Ability Scores Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <LabeledTextInput
                id="edit-str"
                label="Strength (STR)"
                value={formData.str?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, str: parseInt(v) })}
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-dex"
                label="Dexterity (DEX)"
                value={formData.dex?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, dex: parseInt(v) })}
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-con"
                label="Constitution (CON)"
                value={formData.con?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, con: parseInt(v) })}
                placeholder="10"
              />
            </div>

            {/* Ability Scores Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <LabeledTextInput
                id="edit-int"
                label="Intelligence (INT)"
                value={formData.int?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, int: parseInt(v) })}
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-wis"
                label="Wisdom (WIS)"
                value={formData.wis?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, wis: parseInt(v) })}
                placeholder="10"
              />
              <LabeledTextInput
                id="edit-cha"
                label="Charisma (CHA)"
                value={formData.cha?.toString() ?? ''}
                onChange={(v) => setFormData({ ...formData, cha: parseInt(v) })}
                placeholder="10"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 md:p-6 border-t border-slate-700 sticky bottom-0 bg-slate-800">
            <button
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition font-medium"
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

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, CombatState } from "../types";
import LabeledTextInput from "../components/common/LabeledTextInput";
import { DEFAULT_NEW_COMBATANT } from "../constants";
import logo from "../assets/logo.png";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import type { CombatStateManager } from "../state";

type Props = {
  onOpen: (id: string) => void;
  combatStateManager: CombatStateManager;
};

export default function CombatsPage({ onOpen, combatStateManager }: Props) {
  const { t } = useTranslation(["forms", "common"]);
  const [combats, setCombats] = useState<SavedCombat[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    combatStateManager.listCombat().then((c) => {
      setCombats(c);
      setLoading(false);
    });
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    const emptyState: CombatState = {
      combatants: [],
      currentTurn: 0,
      round: 1,
      parkedGroups: [],
      newCombatant: DEFAULT_NEW_COMBATANT,
    };

    const created = await combatStateManager.createCombat({
      name: name.trim(),
      description: description.trim(),
      data: emptyState,
    });
    setName("");
    setDescription("");
    setCombats(await combatStateManager.listCombat());
    onOpen(created.id);
  };

  const del = async (id: string) => {
    await combatStateManager.deleteCombat(id);
    setCombats(await combatStateManager.listCombat());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      create();
    }
  };

  if (loading)
    return <div className="p-6 text-slate-300">{t("common:loading")}</div>;

  return (
    <div className="mx-auto text-white">
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        {/* Header Section with Logo and Inputs */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Logo - centered on mobile */}
            <div className="flex justify-center">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="w-16 h-16 md:w-40 md:h-40 object-contain"
              />
            </div>

            {/* Form inputs */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1">
                <LabeledTextInput
                  id="newName"
                  label={t("forms:combat.newName")}
                  value={name}
                  placeholder={t("forms:combat.newNamePlaceholder")}
                  onChange={setName}
                  onKeyDown={handleKeyPress}
                />
              </div>

              <div className="flex-1">
                <LabeledTextInput
                  id="newDesc"
                  label={t("forms:combat.newDescription")}
                  value={description}
                  placeholder={t("forms:combat.newDescriptionPlaceholder")}
                  onChange={setDescription}
                  onKeyDown={handleKeyPress}
                />
              </div>

              {/* Create Button */}
              <div className="md:flex md:items-end">
                <button
                  onClick={create}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t("common:actions.create")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Combat List Section */}
        <div className="p-4 md:p-6">
          {combats.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <FolderOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg">
                {t("forms:combat.noCombats")}
              </p>
              <p className="text-xs md:text-sm mt-2">
                {t("forms:combat.noCombatsHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {combats.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 rounded p-3 md:p-4 border border-slate-700 hover:border-slate-600 transition gap-3"
                >
                  <div className="flex-1 min-w-0 md:mr-4">
                    <div className="font-semibold text-base md:text-lg text-white truncate">
                      {c.name}
                    </div>
                    {c.description && (
                      <div className="text-xs md:text-sm text-slate-400 mt-1 line-clamp-2">
                        {c.description}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onOpen(c.id)}
                      className="bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("common:actions.open")}
                      </span>
                    </button>
                    <button
                      onClick={() => del(c.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("common:actions.delete")}
                      </span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

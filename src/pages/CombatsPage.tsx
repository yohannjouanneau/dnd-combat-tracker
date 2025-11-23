import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, CombatState } from "../types";
import LabeledTextInput from "../components/common/LabeledTextInput";
import { DEFAULT_NEW_COMBATANT } from "../constants";
import logo from "../assets/logo.png";
import { BookOpen, Plus } from "lucide-react";
import type { CombatStateManager } from "../state";
import CombatList from "../components/CombatsList/CombatList";
import MonsterLibraryModal from "../components/MonsterLibrary/MonsterLibraryModal";

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
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    combatStateManager.listCombat().then((c) => {
      setCombats(c);
      setLoading(false);
    });
  }, [combatStateManager]);

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
              <div className="md:flex gap-2 md:items-end">
                <button
                  onClick={create}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t("common:actions.create")}</span>
                </button>
                <button
                  onClick={() => setShowLibrary(true)}
                  className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Library</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Combat List Section */}
        <CombatList combats={combats} onOpen={onOpen} onDelete={del} />
      </div>

      {/* Monster Library Modal */}
      <MonsterLibraryModal
        isOpen={showLibrary}
        monsters={combatStateManager.monsters}
        canLoadToForm={false}
        onClose={() => setShowLibrary(false)}
        onCreate={combatStateManager.createMonster}
        onDelete={combatStateManager.removeMonster}
        onUpdate={combatStateManager.updateMonster}
        onSearchMonsters={combatStateManager.searchWithLibrary}
      />
    </div>
  );
}

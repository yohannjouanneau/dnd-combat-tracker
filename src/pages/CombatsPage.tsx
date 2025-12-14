import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SavedCombat, CombatState } from "../types";
import LabeledTextInput from "../components/common/LabeledTextInput";
import logo from "../assets/logo.png";
import { BookOpen, Plus, Settings } from "lucide-react";
import CombatList from "../components/CombatsList/CombatList";
import MonsterLibraryModal from "../components/MonsterLibrary/MonsterLibraryModal";
import SettingsModal from "../components/Settings/SettingsModal";
import { generateDefaultNewCombatant, generateId } from "../utils";
import type { CombatStateManager } from "../store/types";

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
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    combatStateManager.listCombat().then((c) => {
      setCombats(c);
      setLoading(false);
    });
  }, [combatStateManager]);

  const create = useCallback(async () => {
    if (!name.trim()) return;
    const emptyState: CombatState = {
      combatants: [],
      currentTurn: 0,
      round: 1,
      parkedGroups: [],
      newCombatant: generateDefaultNewCombatant(),
    };

    const created = await combatStateManager.createCombat({
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      data: emptyState,
    });
    setName("");
    setDescription("");
    setCombats(await combatStateManager.listCombat());
    onOpen(created.id);
  },[combatStateManager, description, name, onOpen])

  const del = useCallback(async (id: string) => {
    await combatStateManager.deleteCombat(id);
    setCombats(await combatStateManager.listCombat());
  },[combatStateManager])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      create();
    }
  },[create])

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
                className="w-16 h-16 md:w-40 md:h-40 rounded-xl"
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

              {/* Action Buttons */}
              <div className="flex gap-2 md:items-end">
                <button
                  onClick={create}
                  className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{t("common:actions.create")}</span>
                </button>
                <button
                  onClick={() => setShowLibrary(true)}
                  className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 px-6 py-3 md:py-2 rounded transition font-semibold h-[42px] whitespace-nowrap flex items-center justify-center gap-2"
                  title={t("common:actions.library")}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="hidden sm:inline">Library</span>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-3 md:py-2 rounded transition font-semibold h-[42px] flex items-center justify-center"
                  title={t("settings:title")}
                >
                  <Settings className="w-5 h-5" />
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        syncApi={combatStateManager.syncApi}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

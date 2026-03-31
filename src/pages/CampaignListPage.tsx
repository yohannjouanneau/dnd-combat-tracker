import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, FolderOpen, Plus } from "lucide-react";
import logo from "../assets/logo.png";
import type { CombatStateManager } from "../store/types";
import { generateId } from "../utils/utils";
import { useToast } from "../components/common/Toast/useToast";
import CampaignCard from "../components/Campaign/CampaignCard";
import LibraryModal from "../components/Library/LibraryModal";

type Props = {
  onOpen: (id: string) => void;
  onBackToCombats: () => void;
  combatStateManager: CombatStateManager;
};

export default function CampaignListPage({
  onOpen,
  onBackToCombats,
  combatStateManager,
}: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);

  const create = useCallback(async () => {
    if (!name.trim()) return;
    await combatStateManager.createCampaign({
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      nodes: [],
      edges: [],
    });
    setName("");
    setDescription("");
    toast.success(t("campaigns:toast.campaignCreated"));
  }, [combatStateManager, description, name, t, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") create();
    },
    [create],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await combatStateManager.deleteCampaign(id);
      toast.success(t("campaigns:toast.campaignDeleted"));
    },
    [combatStateManager, t, toast],
  );

  return (
    <div className="mx-auto text-white h-screen flex flex-col">
      <div className="bg-app-bg flex flex-col h-full">
        {/* Header */}
        <div className="p-4 md:p-6 flex-shrink-0 relative">
          <button
            onClick={onBackToCombats}
            className="absolute top-4 left-4 md:top-6 md:left-6 bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary p-2 rounded transition flex-shrink-0"
            title={t("common:actions.back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="h-20 md:h-40 rounded-xl"
              />
            </div>

            {/* Create form */}
            <div className="bg-panel-bg rounded-lg p-4 border border-border-primary">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="campaignName"
                      className="text-sm text-text-secondary"
                    >
                      {t("campaigns:list.new")}
                    </label>
                    <input
                      id="campaignName"
                      type="text"
                      value={name}
                      placeholder={t("campaigns:list.namePlaceholder")}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="campaignDesc"
                      className="text-sm text-text-secondary"
                    >
                      &nbsp;
                    </label>
                    <input
                      id="campaignDesc"
                      type="text"
                      value={description}
                      placeholder={t("campaigns:list.descriptionPlaceholder")}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {combatStateManager.campaigns.length === 0 ? (
            <div className="text-center text-text-muted py-8">
              <FolderOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg">
                {t("campaigns:list.empty")}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {combatStateManager.campaigns.map((campaign) => (
                <li key={campaign.id}>
                  <CampaignCard
                    campaign={campaign}
                    onOpen={onOpen}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <LibraryModal
        isOpen={showLibrary}
        monsters={combatStateManager.monsters}
        players={combatStateManager.savedPlayers}
        blocks={combatStateManager.blocks}
        canLoadToForm={false}
        onClose={() => setShowLibrary(false)}
        onCreate={combatStateManager.createMonster}
        onDelete={combatStateManager.removeMonster}
        onUpdate={combatStateManager.updateMonster}
        onCreatePlayer={combatStateManager.createPlayer}
        onUpdatePlayer={combatStateManager.updatePlayer}
        onDeletePlayer={combatStateManager.removePlayer}
        onCreateBlock={combatStateManager.createBlock}
        onUpdateBlock={combatStateManager.updateBlock}
        onDeleteBlock={combatStateManager.deleteBlock}
        onToggleAutoAdd={(player) =>
          combatStateManager.updatePlayer(player.id, {
            ...player,
            autoAddToCombat: !player.autoAddToCombat,
          })
        }
        onSearchMonsters={combatStateManager.searchWithLibrary}
        isUsedAsTemplate={combatStateManager.isUsedAsTemplate}
        isPlayerUsedAsTemplate={combatStateManager.isPlayerUsedAsTemplate}
      />
    </div>
  );
}

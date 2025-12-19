import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sword } from "lucide-react";
import ParkedGroupsPanel from "../components/ParkedGroups/ParkedGroupsPanel";
import AddCombatantModal, {
  type AddCombatantModalMode,
} from "../components/CombatForm/AddCombatantModal";
import GroupsOverview from "../components/GroupsOverview/GroupsOverview";
import TurnControls from "../components/TurnControls/TurnControls";
import CombatLayout from "../components/CombatLayout/CombatLayout";
import type {
  GroupSummary,
  SavedPlayer,
  NewCombatant,
  PlayerCombatant,
} from "../types";
import type { CombatStateManager } from "../store/types";
import SavedPlayersPanel from "../components/CombatForm/SavedPlayerPanel";
import logo from "../assets/logo.png";
import SaveBar from "../components/SaveBar";
import { HP_BAR_ID_PREFIX } from "../constants";
import MonsterLibraryModal from "../components/MonsterLibrary/MonsterLibraryModal";
import { generateId, generateDefaultNewCombatant } from "../utils/utils";

type Props = {
  combatStateManager: CombatStateManager;
};

export default function CombatTrackerPage({ combatStateManager }: Props) {
  const { t } = useTranslation("combat");
  const combatants = combatStateManager.state.combatants;
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMode, setAddModalMode] =
    useState<AddCombatantModalMode>("fight");
  const [addToFight, setAddToFight] = useState(false);
  const [addAnOther, setAddAnOther] = useState(false);

  // Keyboard shortcuts for turn navigation and focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      const isHpBarInput = target.id.startsWith(HP_BAR_ID_PREFIX);
      if (
        !isHpBarInput &&
        ((target.tagName && target.tagName === "INPUT") ||
          target.tagName === "TEXTAREA" ||
          combatants.length === 0)
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        combatStateManager.nextTurn();
      } else if (event.key === "ArrowLeft") {
        // Block previous turn if on first combatant of round 1
        const isAtStart =
          combatStateManager.state.round === 1 &&
          combatStateManager.state.currentTurn === 0;
        if (!isAtStart) {
          event.preventDefault();
          combatStateManager.prevTurn();
        }
      } else if (event.key === "f" || event.key === "F") {
        // Toggle focus mode with F key
        event.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [combatants.length, combatStateManager]);

  const handleIncludeParked = (combatant: NewCombatant) => {
    combatStateManager.includeParkedGroup(combatant);
    openAddModal("group");
  };

  const includeToFight = (combatant: NewCombatant) => {
    combatStateManager.addCombatant(combatant);
  };

  const includePlayerToForm = (player: SavedPlayer) => {
    combatStateManager.includePlayer(player);
    openAddModal("player");
  };

  const includePlayerToFight = (player: SavedPlayer) => {
    const playerCombattant: PlayerCombatant = {
      id: generateId(),
      type: "player",
      name: player.name,
      initiativeGroups: player.initiativeGroups,
      hp: player.hp,
      maxHp: player.maxHp,
      ac: player.ac,
      color: player.color,
      imageUrl: player.imageUrl,
      initBonus: player.initBonus,
      externalResourceUrl: player.externalResourceUrl,
    };
    combatStateManager.addCombatant({
      ...playerCombattant,
      templateOrigin: {
        origin: "player_library",
        id: player.id,
      },
    });
  };

  const openAddModal = (mode: AddCombatantModalMode) => {
    setAddModalMode(mode);
    setShowAddModal(true);
  };

  const handleAddToFightChange = (checked: boolean) => {
    setAddToFight(checked);
  };

  const handleAddAnotherChange = (checked: boolean) => {
    setAddAnOther(checked);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    // Always reset form state and checkboxes
    combatStateManager.updateNewCombatant(generateDefaultNewCombatant());
    setAddToFight(false);
    setAddAnOther(false);
  };

  const handleModalSubmit = async () => {
    switch (addModalMode) {
      case "fight":
        combatStateManager.addCombatant();
        break;
      case "player":
        await combatStateManager.savePlayerFromForm(addToFight);
        break;
      case "group":
        combatStateManager.addParkedGroupFromForm(addToFight);
        break;
    }

    // Only close modal if "Add another" is NOT checked
    if (!addAnOther) {
      closeAddModal();
    }
  };

  const stagedFromParkedGroups = combatStateManager.state.parkedGroups.find(
    (group) => group.name === combatStateManager.state.newCombatant.name
  )?.name;
  const stagedPlayer = combatStateManager.savedPlayers.find(
    (group) => group.name === combatStateManager.state.newCombatant.name
  )?.name;
  const stagedFrom = stagedFromParkedGroups ?? stagedPlayer;
  const back = async () => {
    // Auto-save if there are unsaved changes
    if (combatStateManager.hasChanges && combatStateManager.state?.combatId) {
      await combatStateManager.saveCombat({
        name: combatStateManager.state.combatName,
        description: combatStateManager.state.combatDescription,
        data: combatStateManager.state,
        updatedAt: Date.now(),
      });
    }

    // Navigate to combat list
    location.hash = "#combats";
  };

  const handleClearAll = useCallback(() => {
    const groups = combatStateManager.getUniqueGroups();
    groups.forEach((group) => {
      combatStateManager.removeGroup(group.name);
    });
  }, [combatStateManager]);

  return (
    <div className="min-h-screen bg-app-bg text-text-primary p-6">
      <div className="max-w-6xl mx-auto">
        {/* Wrapper with transition for hidden elements */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isFocusMode
              ? "max-h-0 opacity-0 overflow-hidden pointer-events-none"
              : "max-h-[5000px] opacity-100"
          }`}
        >
          {/* Logo - Mobile only, centered at top */}
          <div className="flex justify-center mb-4 md:hidden">
            <img
              src={logo}
              alt="D&D Combat Tracker Logo"
              className="h-20 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 mb-8">
            {/* Logo - Desktop only */}
            <div className="hidden md:flex md:mb-6">
              <img
                src={logo}
                alt="D&D Combat Tracker Logo"
                className="md:h-24 rounded-xl"
              />
            </div>
            <div className="flex-1">
              <SaveBar
                name={combatStateManager.state.combatName ?? ""}
                description={combatStateManager.state.combatDescription ?? ""}
                onChange={(patch) =>
                  combatStateManager.updateCombat(
                    patch.name ?? "",
                    patch.description ?? ""
                  )
                }
                onBack={back}
                onSave={async () => {
                  if (!combatStateManager.state) return;
                  await combatStateManager.saveCombat({
                    name: combatStateManager.state.combatName,
                    description: combatStateManager.state.combatDescription,
                    data: combatStateManager.state,
                    updatedAt: Date.now(),
                  });
                }}
                hasChanges={combatStateManager.hasChanges}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <SavedPlayersPanel
              savedPlayers={combatStateManager.savedPlayers}
              onInclude={includePlayerToForm}
              onFight={includePlayerToFight}
              onRemove={combatStateManager.removePlayer}
              onOpenAddModal={() => openAddModal("player")}
            />

            <ParkedGroupsPanel
              parkedGroups={combatStateManager.state.parkedGroups}
              onInclude={handleIncludeParked}
              onFight={includeToFight}
              onRemove={combatStateManager.removeParkedGroup}
              onOpenAddModal={() => openAddModal("group")}
            />
          </div>

          {combatants.length > 0 && (
            <GroupsOverview
              groups={combatStateManager.getUniqueGroups() as GroupSummary[]}
              onRemoveGroup={combatStateManager.removeGroup}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        <div
          className={`flex gap-2 mb-6 ${
            isFocusMode ? "sticky top-0 z-10 pt-6" : ""
          }`}
        >
          <div className="flex-1">
            <TurnControls
              round={combatStateManager.state.round}
              currentTurn={combatStateManager.state.currentTurn}
              isFocusMode={isFocusMode}
              combatantCount={combatants.length}
              onPrev={combatStateManager.prevTurn}
              onNext={combatStateManager.nextTurn}
              onToggleFocus={() => setIsFocusMode((prev) => !prev)}
              onOpenAddModal={() => openAddModal("fight")}
            />
          </div>
        </div>

        <CombatLayout
          combatants={combatants}
          currentTurn={combatStateManager.state.currentTurn}
          isFocusMode={isFocusMode}
          onRemove={combatStateManager.removeCombatant}
          onDeltaHp={combatStateManager.updateHP}
          onDeathSaves={combatStateManager.updateDeathSave}
          onToggleConcentration={combatStateManager.toggleConcentration}
          onToggleCondition={combatStateManager.toggleCondition}
          onUpdateInitiative={combatStateManager.updateInitiative}
        />

        {combatants.length === 0 && (
          <div className="text-center text-text-muted py-12">
            <Sword className="text-yellow-400 w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">{t("combat:combatant.noCombatants")}</p>
          </div>
        )}

        {/* Monster Library Modal */}
        <MonsterLibraryModal
          isOpen={showLibrary}
          monsters={combatStateManager.monsters}
          canLoadToForm={true}
          onClose={() => {
            setShowLibrary(false);
          }}
          onLoadToForm={(monster) => {
            combatStateManager.loadMonsterToForm({
              source: "library",
              monster: monster,
            });
            setShowLibrary(false);
            openAddModal(addModalMode);
          }}
          onCreate={combatStateManager.createMonster}
          onDelete={combatStateManager.removeMonster}
          onUpdate={combatStateManager.updateMonster}
          onSearchMonsters={(query: string) => {
            return combatStateManager.searchWithLibrary(query, "api");
          }}
          isUsedAsTemplate={combatStateManager.isUsedAsTemplate}
        />

        {/* Add Combatant Modal */}
        <AddCombatantModal
          isOpen={showAddModal}
          mode={addModalMode}
          onClose={closeAddModal}
          newCombatant={combatStateManager.state.newCombatant}
          stagedFrom={stagedFrom}
          totalCount={combatStateManager.getTotalCombatantCount()}
          onChange={combatStateManager.updateNewCombatant}
          onSubmit={handleModalSubmit}
          onAddGroup={handleModalSubmit}
          onSaveAsPlayer={handleModalSubmit}
          onAddInitiativeGroup={combatStateManager.addInitiativeGroup}
          onRemoveInitiativeGroup={combatStateManager.removeInitiativeGroup}
          onUpdateInitiativeGroup={combatStateManager.updateInitiativeGroup}
          onSearchMonsters={combatStateManager.searchWithLibrary}
          onSelectSearchResult={combatStateManager.loadMonsterToForm}
          onAddToLibrary={combatStateManager.addCombatantToLibrary}
          onOpenLibrary={() => setShowLibrary(true)}
          addAnotherChecked={addAnOther}
          addToFightChecked={addToFight}
          onAddToFightChange={handleAddToFightChange}
          onAddAnotherChange={handleAddAnotherChange}
        />
      </div>
    </div>
  );
}

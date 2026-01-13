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
  SavedMonster,
} from "../types";
import type { CombatStateManager } from "../store/types";
import SavedPlayersPanel from "../components/CombatForm/SavedPlayerPanel";
import logo from "../assets/logo.png";
import { HP_BAR_ID_PREFIX } from "../constants";
import MonsterLibraryModal from "../components/MonsterLibrary/MonsterLibraryModal";
import MonsterEditModal from "../components/MonsterLibrary/MonsterEditModal";
import SettingsModal from "../components/Settings/SettingsModal";
import { generateId, generateDefaultNewCombatant } from "../utils/utils";
import TopBar from "../components/TopBar";

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
  const [editingMonster, setEditingMonster] = useState<SavedMonster | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [shouldScrollToActive, setShouldScrollToActive] = useState(false);

  // Wrapper functions for turn navigation with scroll flag
  const handleNextTurn = useCallback(() => {
    setShouldScrollToActive(true);
    combatStateManager.nextTurn();
  }, [combatStateManager]);

  const handlePrevTurn = useCallback(() => {
    setShouldScrollToActive(true);
    combatStateManager.prevTurn();
  }, [combatStateManager]);

  const handleClearScrollFlag = useCallback(() => {
    setShouldScrollToActive(false);
  }, []);

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
        handleNextTurn();
      } else if (event.key === "ArrowLeft") {
        // Block previous turn if on first combatant of round 1
        const isAtStart =
          combatStateManager.state.round === 1 &&
          combatStateManager.state.currentTurn === 0;
        if (!isAtStart) {
          event.preventDefault();
          handlePrevTurn();
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
  }, [combatants.length, combatStateManager, handleNextTurn, handlePrevTurn]);

  const handleEditParkedGroup = (combatant: NewCombatant) => {
    combatStateManager.includeParkedGroup(combatant);
    openAddModal("group");
  };

  const addParkedGroupToFight = (combatant: NewCombatant) => {
    combatStateManager.addCombatant(combatant, { id: combatant.id, origin: 'parked_group'});
  };

  const handleEditPlayer = (player: SavedPlayer) => {
    combatStateManager.includePlayer(player);
    openAddModal("player");
  };

  const addPlayerToFight = (player: SavedPlayer) => {
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
      await combatStateManager.saveCombat();
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

  const handleOpenLibrary = useCallback(() => {
    const { templateOrigin } = combatStateManager.state.newCombatant;
    
    // Check if we have a monster_library template origin with a valid ID
    if (templateOrigin.origin === "monster_library" && templateOrigin.id) {
      // Find the monster in the library
      const monster = combatStateManager.monsters.find(
        (m) => m.id === templateOrigin.id
      );
      
      if (monster) {
        // Open library modal in the background and edit modal on top
        setShowLibrary(true);
        setEditingMonster(monster);
        return;
      }
      // If monster not found, fall through to open library modal
      // (monster may have been deleted from library)
    }
    
    // Otherwise, open the library modal
    setShowLibrary(true);
  }, [combatStateManager.state.newCombatant, combatStateManager.monsters]);

  const handleUpdateMonster = useCallback(
    (updated: SavedMonster) => {
      combatStateManager.updateMonster(updated.id, updated);
      setEditingMonster(undefined);
    },
    [combatStateManager]
  );

  const handleCancelEditMonster = useCallback(() => {
    setEditingMonster(undefined);
  }, []);

  const handleSearchMonstersForEdit = useCallback(
    (query: string) => {
      return combatStateManager.searchWithLibrary(query, "api");
    },
    [combatStateManager]
  );

  return (
    <div className={`bg-app-bg text-text-primary ${isFocusMode ? 'h-screen overflow-hidden flex flex-col px-6 pt-2 pb-6 md:pt-6 md:pb-2' : 'min-h-screen p-6'}`}>
      <div className={`${isFocusMode ? 'flex-1 flex flex-col overflow-y-hidden w-full' : 'max-w-6xl mx-auto'}`}>
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
              <TopBar
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
                  await combatStateManager.saveCombat();
                }}
                hasChanges={combatStateManager.hasChanges}
                syncApi={combatStateManager.syncApi}
                onOpenSettings={() => setShowSettings(true)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <SavedPlayersPanel
              savedPlayers={combatStateManager.savedPlayers}
              onInclude={handleEditPlayer}
              onFight={addPlayerToFight}
              onRemove={combatStateManager.removePlayer}
              onOpenAddModal={() => openAddModal("player")}
            />

            <ParkedGroupsPanel
              parkedGroups={combatStateManager.state.parkedGroups}
              onInclude={handleEditParkedGroup}
              onFight={addParkedGroupToFight}
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
          className={`flex gap-2 ${
            isFocusMode
              ? "sticky bottom-0 left-0 right-0 md:top-0 z-10 order-last md:order-first flex-shrink-0 bg-app-bg px-3 md:px-0 pt-6 md:pt-3 pb-2 md:pb-0 shadow-[0_-2px_12px_rgba(0,0,0,0.15)] md:shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
              : "mb-6"
          }`}
        >
          <div className="flex-1">
            <TurnControls
              round={combatStateManager.state.round}
              currentTurn={combatStateManager.state.currentTurn}
              isFocusMode={isFocusMode}
              combatantCount={combatants.length}
              onPrev={handlePrevTurn}
              onNext={handleNextTurn}
              onToggleFocus={() => setIsFocusMode((prev) => !prev)}
              onOpenAddModal={() => openAddModal("fight")}
            />
          </div>
        </div>

        <div className={isFocusMode ? "flex-1 overflow-y-auto order-first md:order-last" : ""}>
          <CombatLayout
            combatants={combatants}
            currentTurn={combatStateManager.state.currentTurn}
            shouldScrollToActive={shouldScrollToActive}
            onClearScrollFlag={handleClearScrollFlag}
            isFocusMode={isFocusMode}
            onRemove={combatStateManager.removeCombatant}
            onDeltaHp={combatStateManager.updateHP}
            onDeathSaves={combatStateManager.updateDeathSave}
            onToggleCondition={combatStateManager.toggleCondition}
            onUpdateInitiative={combatStateManager.updateInitiative}
          />
        </div>

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
          onOpenLibrary={handleOpenLibrary}
          addAnotherChecked={addAnOther}
          addToFightChecked={addToFight}
          onAddToFightChange={handleAddToFightChange}
          onAddAnotherChange={handleAddAnotherChange}
        />

        {/* Monster Edit Modal - for direct editing */}
        {editingMonster && (
          <MonsterEditModal
            monster={editingMonster}
            isCreating={false}
            onSave={handleUpdateMonster}
            onCancel={handleCancelEditMonster}
            onSearchMonsters={handleSearchMonstersForEdit}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          syncApi={combatStateManager.syncApi}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  );
}

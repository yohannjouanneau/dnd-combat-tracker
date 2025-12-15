import { X, BookOpen, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { MonsterCombatant, SavedMonster, SearchResult } from "../../types";
import MonsterListItem from "./MonsterListItem";
import MonsterEditModal from "./MonsterEditModal";

type Props = {
  isOpen: boolean;
  monsters: SavedMonster[];
  canLoadToForm?: boolean;
  onClose: () => void;
  onLoadToForm?: (monster: SavedMonster) => void;
  onUpdate: (id: string, updated: SavedMonster) => void;
  onCreate: (
    monster: MonsterCombatant
  ) => void;
  onDelete: (id: string) => void;
  onSearchMonsters: (searchName: string) => Promise<SearchResult[]>;
  
};

export default function MonsterLibraryModal({
  isOpen,
  monsters,
  canLoadToForm = false,
  onClose,
  onLoadToForm,
  onUpdate,
  onCreate,
  onDelete,
  onSearchMonsters,
}: Props) {
  const { t } = useTranslation(["common", "forms"]);

  const newMonsterTemplate: SavedMonster = {
    type: "monster",
    id: "",
    name: "",
    imageUrl: "",
    createdAt: 0,
    updatedAt: 0,
    color: "red",
    externalResourceUrl: "",
    initiativeGroups: [],
  };

  const [editingMonster, setEditingMonster] = useState<
    SavedMonster | undefined
  >(undefined);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleUpdateMonster = (updated: SavedMonster) => {
    onUpdate(updated.id, updated);
    setEditingMonster(undefined);
  };

  const handleCreateMonster = (newMonster: SavedMonster) => {
    onCreate(newMonster);
    setIsCreating(false);
  };

  const onSave = isCreating ? handleCreateMonster : handleUpdateMonster;
  const onCancel = isCreating
    ? () => {
        setIsCreating(false);
      }
    : () => {
        setEditingMonster(undefined);
      };
  const monster = isCreating ? newMonsterTemplate : editingMonster;
  const editModal =
    isCreating || editingMonster ? (
      <MonsterEditModal
        monster={monster ?? newMonsterTemplate}
        onSave={onSave}
        onCancel={onCancel}
        isCreating={isCreating}
        onSearchMonsters={onSearchMonsters}
      />
    ) : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="!mt-0 fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
        <div className="bg-panel-bg rounded-lg border border-border-primary max-w-4xl w-full max-h-[90vh] shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-primary">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                {t("forms:library.title")}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreating(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded transition font-medium flex items-center gap-2"
                title={t("forms:library.newHint")}
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">
                {t("forms:library.new")}
                </span>
              </button>
              <button
                onClick={onClose}
                className="text-text-muted hover:text-text-primary transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-h-[60vh]">
            {monsters.length === 0 ? (
              <div className="text-center text-text-muted py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                    {t("forms:library.emptyListTitle")}
                </p>
                <p className="text-sm mt-2">
                  {t("forms:library.emptyListMessage")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {monsters.map((monster) => (
                  <MonsterListItem
                    key={monster.id}
                    monster={monster}
                    canLoadToForm={canLoadToForm}
                    onLoadToForm={onLoadToForm}
                    onEdit={setEditingMonster}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border-primary p-4 md:p-6">
            <button
              onClick={onClose}
              className="w-full md:w-auto bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary px-6 py-2 rounded transition font-medium"
            >
              {t("common:actions.close")}
            </button>
          </div>
        </div>
      </div>
      {editModal}
    </>
  );
}

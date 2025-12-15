import { FolderOpen } from "lucide-react";
import type { SavedCombat } from "../../types";
import CombatListItem from "./CombatListItem";
import { useTranslation } from "react-i18next";

interface Props {
  combats: SavedCombat[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CombatList({ combats, onOpen, onDelete }: Props) {
  const { t } = useTranslation(["forms"]);

  return (
    <div className="p-4 md:p-6">
      {combats.length === 0 ? (
        <div className="text-center text-text-muted py-8">
          <FolderOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
          <p className="text-base md:text-lg">{t("forms:combat.noCombats")}</p>
          <p className="text-xs md:text-sm mt-2">
            {t("forms:combat.noCombatsHint")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {combats.map((c) => (
            <CombatListItem combat={c} onOpen={onOpen} onDelete={onDelete} key={c.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

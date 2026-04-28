import { FolderOpen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Campaign } from "../../types/campaign";
import { useConfirmationDialog } from "../../hooks/useConfirmationDialog";
import Button from "../common/Button";

interface Props {
  campaign: Campaign;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CampaignCard({ campaign, onOpen, onDelete }: Props) {
  const { t } = useTranslation(["campaigns", "common"]);
  const confirmDialog = useConfirmationDialog();

  const confirmRemove = async () => {
    const isConfirmed = await confirmDialog({
      title: t("campaigns:delete.campaignTitle"),
      message: t("campaigns:delete.campaignMessage"),
    });
    if (isConfirmed) {
      onDelete(campaign.id);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between bg-panel-bg rounded p-3 md:p-4 border border-border-primary hover:border-border-secondary transition gap-3">
      <div className="flex-1 min-w-0 md:mr-4">
        <div className="font-semibold text-base md:text-lg text-text-primary truncate">
          {campaign.name}
        </div>
        {campaign.description && (
          <div className="text-xs md:text-sm text-text-muted mt-1 line-clamp-2">
            {campaign.description}
          </div>
        )}
        <div className="text-xs text-text-muted mt-1">
          {campaign.nodes.length}{" "}
          {campaign.nodes.length === 1 ? "block" : "blocks"}
        </div>
      </div>
      <div className="grid grid-cols-2 md:flex gap-2 flex-shrink-0">
        <Button
          variant="success"
          onClick={() => onOpen(campaign.id)}
          className="px-3 md:px-4 flex items-center justify-center gap-1"
        >
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.open")}</span>
        </Button>
        <Button
          variant="danger"
          onClick={confirmRemove}
          className="px-3 md:px-4 flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t("common:actions.delete")}</span>
        </Button>
      </div>
    </div>
  );
}

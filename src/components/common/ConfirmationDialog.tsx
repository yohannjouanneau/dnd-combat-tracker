import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Button from "./Button";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning";
};

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "danger",
}: Props) {
  const { t } = useTranslation(["common"]);

  const confirm = confirmText ?? t("common:confirmation.confirm");
  const cancel = cancelText ?? t("common:confirmation.cancel");

  return (
    <Modal open={isOpen} onClose={onCancel} title={title} layer="dialog">
      <Modal.Body>
        <p className="text-text-secondary">{message}</p>
      </Modal.Body>
      <Modal.Footer className="flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          {cancel}
        </Button>
        {onConfirm && (
          <Button
            variant={variant === "warning" ? "warning" : "danger"}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirm}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

import { useState, type ReactNode } from "react";
import ConfirmationDialog from "../components/common/ConfirmationDialog";
import { ConfirmDialogContext } from "./ConfirmationDialogContext";

interface Options {
  title: string;
  message: string;
  confirm?: string;
  cancel?: string;
  noConfirmButton?: boolean;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirm?: string;
  cancel?: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export type ConfirmDialog = (options: Options) => Promise<boolean>;

export function ConfirmationDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    onCancel: () => {},
  });

  const confirm = ({
    title,
    message,
    cancel,
    confirm,
    noConfirmButton = false,
  }: Options): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        cancel,
        confirm,
        onConfirm: !noConfirmButton
          ? () => {
              setDialogState((prev) => ({ ...prev, isOpen: false }));
              resolve(true);
            }
          : undefined,
        onCancel: () => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const dialog = dialogState.isOpen ? (
    <ConfirmationDialog
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirm}
      cancelText={dialogState.cancel}
      onConfirm={dialogState.onConfirm}
      onCancel={dialogState.onCancel}
    />
  ) : undefined;

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {dialog}
    </ConfirmDialogContext.Provider>
  );
}

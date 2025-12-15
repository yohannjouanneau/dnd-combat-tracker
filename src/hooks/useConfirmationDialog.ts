import { useContext } from "react";
import { ConfirmDialogContext } from "../contexts/ConfirmationDialogContext";

export const useConfirmationDialog = () => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
      throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
  };
import { createContext } from "react";
import type { ConfirmDialog } from "./ConfirmationDialogProvider";

export const ConfirmDialogContext = createContext<ConfirmDialog | undefined>(
    undefined
  );
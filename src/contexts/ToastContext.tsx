import { createContext } from "react";
import type { ToastApi } from "./ToastProvider";

export const ToastContext = createContext<ToastApi|undefined>(undefined);
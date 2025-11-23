import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { ConfirmationDialogProvider } from "./hooks/ConfirmationDialogProvider.tsx";
import { ToastProvider } from "./components/common/Toast/ToastProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmationDialogProvider>
        <App />
      </ConfirmationDialogProvider>
    </ToastProvider>
  </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { ConfirmationDialogProvider } from "./hooks/ConfirmationDialogProvider.tsx";
import { ToastProvider } from "./components/common/Toast/ToastProvider.tsx";
import { ThemeProvider } from "./contexts/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfirmationDialogProvider>
          <App />
        </ConfirmationDialogProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);

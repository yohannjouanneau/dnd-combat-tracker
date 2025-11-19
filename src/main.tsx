import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { ConfirmationDialogProvider } from "./hooks/ConfirmationDialogProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfirmationDialogProvider>
      <App />
    </ConfirmationDialogProvider>
  </StrictMode>
);
  
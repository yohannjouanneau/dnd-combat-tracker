import { useTranslation } from "react-i18next";
import { Expand, Maximize2, Minimize2, Shrink } from "lucide-react";

type Props = {
  isFocusMode: boolean;
  onToggle: () => void;
};

export default function FocusModeToggle({ isFocusMode, onToggle }: Props) {
  const { t } = useTranslation("combat");

  const title = isFocusMode
    ? `${t("combat:focusMode.exit")} ${t("combat:focusMode.keyHint")}`
    : `${t("combat:focusMode.enter")} ${t("combat:focusMode.keyHint")}`;

  const buttonColor = isFocusMode ? 'bg-panel-secondary' : 'bg-panel-bg' 

  return (
    <button
      onClick={onToggle}
      className={`${buttonColor} hover:bg-panel-secondary transition rounded-lg px-4 py-4 border border-border-primary flex items-center justify-center`}
      title={title}
    >
      {isFocusMode ? (
        <Minimize2 className="w-5 h-5" />
      ) : (
        <Maximize2 className="w-5 h-5" />
      )}
    </button>
  );
}

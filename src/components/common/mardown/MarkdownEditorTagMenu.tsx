import { MARKDOWN_EDITOR_TAG_MENU_ITEMS } from "../../../constants";
import { useTranslation } from "react-i18next";

interface Props {
  wrapWithTag: (tagName: string, placeholder: string) => void;
}

export function MarkdownEditorTagMenu({ wrapWithTag }: Props) {
  const { t } = useTranslation(["forms"]);

  return (
    <>
      <div className="absolute top-full left-0 mt-1 bg-panel-bg border border-border-primary rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-border-secondary scrollbar-track-panel-bg">
        {MARKDOWN_EDITOR_TAG_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => wrapWithTag(item.key, item.placeholder)}
              className="w-full px-3 py-2 text-left text-xs hover:bg-panel-secondary transition flex items-center gap-2"
            >
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-text-secondary">{`{${item.key}:}`}</span>
              <span className="text-text-muted ml-auto text-[10px]">
                {t(`forms:library.notes.tags.${item.labelKey}`)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

import { MARKDOWN_EDITOR_TAG_MENU_ITEMS } from "../../../constants";
import { useTranslation } from "react-i18next";

interface Props {
  wrapWithTag: (tagName: string, placeholder: string) => void;
}

export function MarkdownEditorTagMenu({ wrapWithTag }: Props) {
  const { t } = useTranslation(["forms"]);

  return (
    <>
      <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {MARKDOWN_EDITOR_TAG_MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => wrapWithTag(item.key, item.placeholder)}
              className="w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition flex items-center gap-2"
            >
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span className="text-slate-300">{`{${item.key}:}`}</span>
              <span className="text-slate-500 ml-auto text-[10px]">
                {t(`forms:library.notes.tags.${item.labelKey}`)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

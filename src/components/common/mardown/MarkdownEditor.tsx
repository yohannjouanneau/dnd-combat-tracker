import { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Edit3,
  Sparkles,
  ChevronDown,
  Sword,
  Flame,
  Shield,
  Heart,
  ShieldCheck,
  Skull,
  Target,
  Wind,
  ShieldPlus,
  RotateCw,
  Star,
  ShieldX
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownHelpTooltip from './MarkdownHelpTooltip';
import MarkdownRenderer from './MarkdownRenderer';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  maxLength = 10000,
}: Props) {
  const { t } = useTranslation(['forms']);
  const [isPreview, setIsPreview] = useState(false);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultPlaceholder = t('forms:library.notes.placeholder');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagMenuOpen(false);
      }
    };

    if (isTagMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTagMenuOpen]);

  // Generic wrap function for any tag
  const wrapWithTag = (tagName: string, placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const scrollTop = textarea.scrollTop;

    const textToWrap = selectedText || placeholder;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    const newText = beforeText + `{${tagName}: ${textToWrap}}` + afterText;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + `{${tagName}: ${textToWrap}}`.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop;
    }, 0);

    setIsTagMenuOpen(false);
  };

  // Tag menu items configuration
  const tagMenuItems = [
    // Combat
    { key: 'hit', icon: Sword, color: 'text-red-400', labelKey: 'hit', placeholder: '+0' },
    { key: 'dmg', icon: Flame, color: 'text-orange-400', labelKey: 'dmg', placeholder: '1d6' },
    { key: 'heal', icon: Heart, color: 'text-green-400', labelKey: 'heal', placeholder: '1d8' },
    // Status & Utility
    { key: 'cond', icon: Skull, color: 'text-yellow-400', labelKey: 'cond', placeholder: 'poisoned' },
    { key: 'range', icon: Target, color: 'text-purple-400', labelKey: 'range', placeholder: '30 ft.' },
    { key: 'speed', icon: Wind, color: 'text-sky-400', labelKey: 'speed', placeholder: '30 ft.' },
    // Defense
    { key: 'save', icon: Shield, color: 'text-blue-400', labelKey: 'save', placeholder: 'DC 10' },
    { key: 'ac', icon: ShieldCheck, color: 'text-cyan-400', labelKey: 'ac', placeholder: '15' },
    { key: 'resist', icon: ShieldPlus, color: 'text-indigo-400', labelKey: 'resist', placeholder: 'fire' },
    { key: 'vuln', icon: ShieldX, color: 'text-red-500', labelKey: 'vuln', placeholder: 'cold' },
    // Special
    { key: 'spell', icon: Sparkles, color: 'text-pink-400', labelKey: 'spell', placeholder: 'Fireball' },
    { key: 'recharge', icon: RotateCw, color: 'text-amber-400', labelKey: 'recharge', placeholder: '5-6' },
    { key: 'legendary', icon: Star, color: 'text-yellow-300', labelKey: 'legendary', placeholder: '3' },
  ];

  return (
    <div className="space-y-2">
      {/* Header with tabs and help */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-300">
            {t('forms:library.notes.label')}
          </label>
          <MarkdownHelpTooltip />
        </div>

        {/* Action buttons and tabs */}
        <div className="flex gap-2">
          {/* Tag dropdown menu - separate group */}
          <div className="flex gap-1 bg-slate-900 rounded p-1 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
              disabled={isPreview}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
              title={t('forms:library.notes.tagMenu')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('forms:library.notes.tagsLabel')}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {isTagMenuOpen && !isPreview && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {tagMenuItems.map((item) => {
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
            )}
          </div>

          {/* Write/Preview tabs */}
          <div className="flex gap-1 bg-slate-900 rounded p-1">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                !isPreview
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('forms:library.notes.write')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                isPreview
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('forms:library.notes.preview')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor or Preview */}
      <div className="relative">
        {!isPreview ? (
          // Write mode - Textarea
          <div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder ?? defaultPlaceholder}
              maxLength={maxLength}
              rows={8}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none resize-y min-h-[120px] text-base"
            />
            {/* Character counter */}
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  value.length > maxLength * 0.9
                    ? 'text-orange-400'
                    : 'text-slate-500'
                }`}
              >
                {value.length} / {maxLength.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          // Preview mode - Rendered markdown
          <div className="min-h-[120px] max-h-96 overflow-y-auto bg-slate-900 rounded px-3 py-2 border border-slate-600">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-slate-500 text-sm italic">
                {t('forms:library.notes.emptyPreview')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
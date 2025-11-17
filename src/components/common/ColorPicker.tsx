import { useTranslation } from "react-i18next";
import { DEFAULT_COLOR_PRESET } from "../../constants";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation("colors");
  return (
    <div className="flex gap-1 self-end">
      {DEFAULT_COLOR_PRESET.map((preset) => {
        const name = t(`colors:${preset.key}`);
        return (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`w-8 h-8 rounded border-2 transition ${
              value === preset.value
                ? "border-white scale-110"
                : "border-slate-600"
            }`}
            style={{ backgroundColor: preset.value }}
            title={name}
          />
        );
      })}
    </div>
  );
}

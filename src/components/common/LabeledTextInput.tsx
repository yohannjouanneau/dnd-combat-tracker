type Props = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
};

export default function LabeledTextInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  onKeyDown,
  className,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-300 text-start">
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={
          className ||
          "bg-slate-700 text-white rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
        }
      />
    </div>
  );
}

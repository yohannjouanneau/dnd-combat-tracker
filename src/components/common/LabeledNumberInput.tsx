type Props = {
  id: string;
  label: string;
  value: string | number;
  placeholder?: string;
  min?: number;
  onChange: (value: string) => void;
  className?: string;
};

export default function LabeledNumberInput({
  id,
  label,
  value,
  placeholder,
  min,
  onChange,
  className,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-slate-300 text-start">
        {label}
      </label>
      <input
        id={id}
        type="number"
        placeholder={placeholder}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          className ||
          "bg-slate-700 rounded px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
        }
      />
    </div>
  );
}

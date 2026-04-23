import { cn } from "../../utils/cn";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  id?: string;
};

export default function Select({
  label,
  id,
  className,
  children,
  ...props
}: Props) {
  const select = (
    <select
      id={id}
      className={cn(
        "bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none text-sm w-full cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );

  if (label) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm text-text-secondary text-start">
          {label}
        </label>
        {select}
      </div>
    );
  }

  return select;
}

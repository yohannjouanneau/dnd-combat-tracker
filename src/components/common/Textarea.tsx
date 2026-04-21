import { cn } from "../../utils/cn";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  id?: string;
};

export default function Textarea({ label, id, className, ...props }: Props) {
  const textarea = (
    <textarea
      id={id}
      className={cn(
        "bg-input-bg text-text-primary rounded px-3 py-2 border border-border-secondary focus:border-blue-500 focus:outline-none resize-y w-full text-sm",
        className,
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm text-text-secondary text-start">
          {label}
        </label>
        {textarea}
      </div>
    );
  }

  return textarea;
}

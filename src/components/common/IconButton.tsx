import { cn } from "../../utils/cn";

type Variant = "filled" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  filled: "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary",
  ghost: "text-text-muted hover:text-text-primary",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function IconButton({
  variant = "filled",
  size = "md",
  className,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "rounded transition",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

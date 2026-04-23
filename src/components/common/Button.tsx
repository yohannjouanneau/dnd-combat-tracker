import { cn } from "../../utils/cn";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium",
  secondary:
    "bg-panel-secondary hover:bg-panel-secondary/80 text-text-primary font-medium",
  danger: "bg-red-600 hover:bg-red-700 text-white font-medium",
  success: "bg-green-600 hover:bg-green-700 text-white font-medium",
  warning: "bg-amber-600 hover:bg-amber-700 text-white font-medium",
  ghost: "text-text-muted hover:text-text-primary",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-4 py-3 text-sm",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export default function Button({
  variant = "secondary",
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

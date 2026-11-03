import { cn } from "../../utils/cn";

type Props = {
  className?: string;
};

/**
 * 20-sided die (icosahedron, front view). Lucide has no d20 icon, so this
 * mirrors lucide's stroke style: 24x24 viewBox, currentColor stroke.
 */
export default function D20Icon({ className }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("w-4 h-4", className)}
    >
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" />
      <polyline points="3 7 12 12 21 7" />
      <line x1="12" y1="12" x2="12" y2="22" />
      <line x1="12" y1="12" x2="3" y2="17" />
      <line x1="12" y1="12" x2="21" y2="17" />
    </svg>
  );
}

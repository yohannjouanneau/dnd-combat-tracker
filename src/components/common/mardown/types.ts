import type { LucideIcon } from "lucide-react";

export interface TagMenuItem {
  key: string;
  icon: LucideIcon;
  color: string;
  labelKey: string;
  placeholder: string;
}

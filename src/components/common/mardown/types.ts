import type { LucideIcon } from "lucide-react";

export interface EditorTagMenuItem {
  key: string;
  icon: LucideIcon;
  color: string;
  labelKey: string;
  placeholder: string;
}

export type EditorTag = {
  pattern: RegExp;
  icon: LucideIcon
  className: string;
};

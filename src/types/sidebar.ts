
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isGlobal?: boolean;
}

export interface SidebarSection {
  items: SidebarItem[];
  title?: string;
}

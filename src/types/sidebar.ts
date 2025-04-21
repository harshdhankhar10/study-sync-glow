
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  isGlobal?: boolean;
  isFeatured?: boolean;
}

export interface SidebarSection {
  items: SidebarItem[];
  title?: string;
}

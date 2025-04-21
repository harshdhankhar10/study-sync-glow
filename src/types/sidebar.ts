
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface SidebarSection {
  items: SidebarItem[];
  title?: string;
}


import { SidebarSection as SidebarSectionType } from "@/types/sidebar";
import { SidebarItem } from "./SidebarItem";

interface SidebarSectionProps {
  section: SidebarSectionType;
  currentPath: string;
  onItemClick?: () => void;
}

export function SidebarSection({ section, currentPath, onItemClick }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {section.title && (
        <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {section.title}
        </h3>
      )}
      <div className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            isActive={currentPath === item.href}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

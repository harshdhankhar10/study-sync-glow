
import { cn } from "@/lib/utils";
import { SidebarItem as SidebarItemType } from "@/types/sidebar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Globe } from "lucide-react";

interface SidebarItemProps {
  item: SidebarItemType;
  isActive: boolean;
  onClick?: () => void;
}

export function SidebarItem({ item, isActive, onClick }: SidebarItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(item.href);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative w-full flex items-center gap-x-3 rounded-lg p-2 text-sm font-medium transition-all duration-150",
        isActive 
          ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600"
          : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50"
      )}
    >
      <item.icon className={cn(
        "w-5 h-5 transition-colors duration-150",
        isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-indigo-600"
      )} />
      <span className="flex-1 truncate">{item.title}</span>
      {item.isGlobal && (
        <Globe className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
      )}
      {item.badge && (
        <Badge variant="secondary" className="bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
          {item.badge}
        </Badge>
      )}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-indigo-600" />
      )}
    </button>
  );
}

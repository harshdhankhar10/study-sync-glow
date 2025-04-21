
import { cn } from "@/lib/utils";
import { SidebarItem as SidebarItemType } from "@/types/sidebar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Globe, Sparkles } from "lucide-react";

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
        "group relative w-full flex items-center gap-x-3 rounded-lg p-2.5 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 text-indigo-600 shadow-sm"
          : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-5 h-5 transition-colors duration-200",
        isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600"
      )}>
        <item.icon className="w-[18px] h-[18px]" />
      </div>
      
      <span className="flex-1 truncate font-medium">{item.title}</span>
      
      {item.isGlobal && (
        <Globe className="w-3.5 h-3.5 text-blue-500 animate-pulse opacity-75" />
      )}
      {item.isFeatured && (
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse opacity-75" />
      )}
      {item.badge && (
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] px-2 py-0.5">
          {item.badge}
        </Badge>
      )}
      
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-indigo-600 to-purple-600" />
      )}
    </button>
  );
}

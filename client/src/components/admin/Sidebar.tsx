import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { 
  LayoutDashboard, 
  Bell, 
  Calendar, 
  Trophy, 
  Users, 
  FileText, 
  Database, 
  Settings,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar = ({ collapsed, setCollapsed }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };
  
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-sidebar text-sidebar-foreground min-h-screen relative border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <Logo size="sm" withText={true} className="text-sidebar-foreground" />
        )}
        {collapsed && (
          <Logo size="sm" withText={false} className="text-sidebar-foreground mx-auto" />
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute -right-3 top-6 rounded-full border border-sidebar-border shadow-sm bg-sidebar"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="p-2">
        <nav className="space-y-1">
          <Link href="/admin">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin") && !isActive("/admin/") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              {!collapsed && <span>Tổng quan</span>}
            </Button>
          </Link>
          
          <Link href="/admin/announcements">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/announcements") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <Bell className="h-5 w-5 mr-2" />
              {!collapsed && <span>Thông báo</span>}
            </Button>
          </Link>
          
          <Link href="/admin/events">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/events") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <Calendar className="h-5 w-5 mr-2" />
              {!collapsed && <span>Sự kiện</span>}
            </Button>
          </Link>
          
          <Link href="/admin/tournaments">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/tournaments") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <Trophy className="h-5 w-5 mr-2" />
              {!collapsed && <span>Giải đấu</span>}
            </Button>
          </Link>
          
          <Link href="/admin/users">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/users") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <Users className="h-5 w-5 mr-2" />
              {!collapsed && <span>Người dùng</span>}
            </Button>
          </Link>
          
          <Link href="/admin/forms">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/forms") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <FileText className="h-5 w-5 mr-2" />
              {!collapsed && <span>Biểu mẫu</span>}
            </Button>
          </Link>
          
          <Link href="/admin/export">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive("/admin/export") && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-4"
              )}
            >
              <Database className="h-5 w-5 mr-2" />
              {!collapsed && <span>Xuất dữ liệu</span>}
            </Button>
          </Link>
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
        <Link href="/">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "px-2" : "px-4"
            )}
          >
            <Settings className="h-5 w-5 mr-2" />
            {!collapsed && <span>Về trang chủ</span>}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

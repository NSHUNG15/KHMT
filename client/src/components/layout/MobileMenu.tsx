import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  user: any;
  onLogout: () => void;
}

const MobileMenu = ({ user, onLogout }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [location] = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    closeMenu();
  };

  const handleLogout = () => {
    onLogout();
    closeMenu();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex items-center sm:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu}
        aria-controls="mobile-menu"
        aria-expanded={isOpen}
      >
        <span className="sr-only">Mở menu</span>
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={cn("sm:hidden absolute top-16 inset-x-0 z-50 bg-white shadow-md transition-all duration-200 ease-in-out", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <a 
            href="/" 
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              isActive("/") 
                ? "bg-primary-50 border-primary text-primary-800"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => { e.preventDefault(); handleNavigation("/"); }}
          >
            Trang chủ
          </a>
          <a 
            href="/announcements" 
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              isActive("/announcements") 
                ? "bg-primary-50 border-primary text-primary-800"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => { e.preventDefault(); handleNavigation("/announcements"); }}
          >
            Hoạt động
          </a>
          <a 
            href="/events" 
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              isActive("/events") 
                ? "bg-primary-50 border-primary text-primary-800"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => { e.preventDefault(); handleNavigation("/events"); }}
          >
            Sự kiện
          </a>
          <a 
            href="/tournaments" 
            className={cn(
              "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
              isActive("/tournaments") 
                ? "bg-primary-50 border-primary text-primary-800"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            )}
            onClick={(e) => { e.preventDefault(); handleNavigation("/tournaments"); }}
          >
            Hội thao
          </a>
          <a 
            href="#about" 
            className="border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            onClick={closeMenu}
          >
            Giới thiệu
          </a>
        </div>
        
        {user ? (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <UserAvatar user={user} />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.fullName}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto text-gray-400">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-3 space-y-1">
              <a 
                href="/profile" 
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={(e) => { e.preventDefault(); handleNavigation("/profile"); }}
              >
                Hồ sơ cá nhân
              </a>
              {user.role === "admin" && (
                <a 
                  href="/admin" 
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={(e) => { e.preventDefault(); handleNavigation("/admin"); }}
                >
                  Quản trị viên
                </a>
              )}
              <a 
                href="#" 
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                onClick={(e) => { e.preventDefault(); handleLogout(); }}
              >
                Đăng xuất
              </a>
            </div>
          </div>
        ) : (
          <div className="py-4 border-t border-gray-200 flex justify-center">
            <Button 
              variant="default" 
              onClick={() => handleNavigation("/login")}
            >
              Đăng nhập
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;

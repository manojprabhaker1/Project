import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  activePage: string;
};

export function Sidebar({ activePage }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Base sidebar content
  const sidebarContent = (
    <>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
            CA
          </div>
          <span className="ml-2 text-xl font-semibold text-secondary">CloudDev Access</span>
        </div>
      </div>

      {/* User info */}
      <div className="border-t border-b border-gray-200 py-4 px-6">
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback className="bg-primary text-white">
              {user ? getInitials(user.displayName) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Available Credits</span>
            <div className="flex items-center">
              <span className="material-icons text-sm text-primary">toll</span>
              <span className="ml-1 font-semibold">{user?.credits}</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-500">Active Sessions</span>
            <div className="flex items-center">
              <span className="material-icons text-sm text-success">dvr</span>
              <span className="ml-1 font-semibold">1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="py-4 flex-grow">
        <nav className="px-4 space-y-1">
          <div className={`sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium ${activePage === 'dashboard' ? 'active text-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`} 
            onClick={() => navigate("/")}>
              <span className={`material-icons mr-3 ${activePage === 'dashboard' ? 'text-primary' : 'text-gray-500'}`}>dashboard</span>
              Dashboard
          </div>
          <a href="#" className="sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <span className="material-icons text-gray-500 mr-3">code</span>
            My Workspaces
          </a>
          <a href="#" className="sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <span className="material-icons text-gray-500 mr-3">folder</span>
            My Files
          </a>
          <a href="#" className="sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <span className="material-icons text-gray-500 mr-3">history</span>
            Session History
          </a>
          
          {/* Admin section - only shown if user is admin */}
          {user?.isAdmin && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
              <div className="mt-2 space-y-1">
                <div
                  className={`sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium cursor-pointer ${activePage === 'admin' ? 'active text-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => navigate("/admin")}
                >
                  <span className={`material-icons mr-3 ${activePage === 'admin' ? 'text-primary' : 'text-gray-500'}`}>people</span>
                  User Management
                </div>
                <div
                  className={`sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium cursor-pointer ${activePage === 'credits' ? 'active text-primary' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                  onClick={() => navigate("/admin")}
                >
                  <span className={`material-icons mr-3 ${activePage === 'credits' ? 'text-primary' : 'text-gray-500'}`}>toll</span>
                  Credit Allocation
                </div>
                <a href="#" className="sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <span className="material-icons text-gray-500 mr-3">settings</span>
                  System Settings
                </a>
                <a href="#" className="sidebar-item flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  <span className="material-icons text-gray-500 mr-3">insert_chart</span>
                  Usage Analytics
                </a>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <a href="#" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
          <span className="material-icons text-gray-500 mr-2">help_outline</span>
          Help & Support
        </a>
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="mt-2 flex items-center w-full text-left text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="material-icons text-gray-500 mr-2">logout</span>
          Sign Out
        </button>
      </div>
    </>
  );

  // Mobile hamburger menu
  const mobileMenuToggle = (
    <button
      onClick={toggleMobileSidebar}
      className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
      aria-label="Toggle sidebar"
    >
      <span className="material-icons">{isMobileOpen ? 'close' : 'menu'}</span>
    </button>
  );

  return (
    <>
      {/* Mobile menu button - shown only on small screens */}
      <div className="absolute top-4 right-4 md:hidden z-20">
        {mobileMenuToggle}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar - conditionally shown */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-gray-600 bg-opacity-75">
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

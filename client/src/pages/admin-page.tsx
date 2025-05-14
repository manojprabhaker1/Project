import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import CreditManagement from "@/components/credit-management";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch users for admin
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    refetch: refetchUsers 
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    onError: (error) => {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Redirect if not an admin
  if (user && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activePage="admin" />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center md:hidden">
                  <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
                    DT
                  </div>
                  <span className="ml-2 text-xl font-semibold text-secondary">DevTools Hub</span>
                </div>
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                  <div className="px-3 py-2 text-sm font-medium text-gray-900">
                    Administration
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button type="button" className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                  <span className="material-icons">notifications</span>
                </button>
                <button type="button" className="ml-3 p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                  <span className="material-icons">help_outline</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content container */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            {/* Page header */}
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold text-secondary sm:truncate">
                    Administration
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage users, credits, and system settings
                  </p>
                </div>
              </div>
            </div>

            {/* Credit Management Section */}
            <CreditManagement 
              users={users || []} 
              isLoading={isLoadingUsers}
              onCreditUpdate={() => refetchUsers()}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

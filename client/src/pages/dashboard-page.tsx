import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tool, Session } from "@shared/schema";
import { Loader2 } from "lucide-react";
import ActiveSessions from "@/components/active-sessions";
import ToolCard from "@/components/tool-card";
import UsageStatistics from "@/components/usage-statistics";
import RecentSessions from "@/components/recent-sessions";
import JupyterInstance from "@/components/jupyter-instance";

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"dashboard" | "jupyter">("dashboard");
  const [activeSession, setActiveSession] = useState<(Session & { jupyterUrl?: string; token?: string }) | null>(null);
  
  // Fetch tools
  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });
  
  // Fetch active sessions
  const { 
    data: activeSessions, 
    isLoading: isLoadingActiveSessions,
    refetch: refetchActiveSessions
  } = useQuery<Session[]>({
    queryKey: ["/api/sessions/active"],
  });
  
  // Fetch session history
  const { 
    data: sessionHistory, 
    isLoading: isLoadingSessionHistory,
    refetch: refetchSessionHistory
  } = useQuery<Session[]>({
    queryKey: ["/api/sessions/history"],
  });

  // Function to launch Jupyter when needed
  const handleOpenSession = (session: Session & { jupyterUrl?: string; token?: string }) => {
    if (session.toolName?.toLowerCase().includes("jupyter")) {
      setActiveSession(session);
      setCurrentView("jupyter");
    }
  };

  // Return to dashboard from Jupyter view
  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    refetchActiveSessions();
    refetchSessionHistory();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activePage="dashboard" />
      
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
                    {currentView === "dashboard" ? "Dashboard" : "Jupyter Notebook"}
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
          {currentView === "dashboard" ? (
            <div className="py-6">
              {/* Page header */}
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-semibold text-secondary sm:truncate">
                      Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Launch and manage your development environments
                    </p>
                  </div>
                  <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <span className="material-icons text-gray-500 mr-2 text-sm">add</span>
                      New Workspace
                    </button>
                    <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <span className="material-icons text-white mr-2 text-sm">play_arrow</span>
                      Resume Session
                    </button>
                  </div>
                </div>
              </div>

              {/* Active sessions */}
              <ActiveSessions 
                activeSessions={activeSessions || []} 
                isLoading={isLoadingActiveSessions}
                onOpenSession={handleOpenSession}
                onEndSession={() => {
                  refetchActiveSessions();
                  refetchSessionHistory();
                }}
              />

              {/* Development tools */}
              <div className="mt-8 px-4 sm:px-6 lg:px-8">
                <h2 className="text-lg font-medium text-secondary">Development Tools</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Launch a new development environment using your available credits
                </p>
                
                {isLoadingTools ? (
                  <div className="flex justify-center mt-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {tools?.map(tool => (
                      <ToolCard 
                        key={tool.id} 
                        tool={tool} 
                        userCredits={user?.credits || 0}
                        onSessionCreated={() => {
                          refetchActiveSessions();
                          refetchSessionHistory();
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Usage statistics */}
              <UsageStatistics userId={user?.id || 0} />

              {/* Recent sessions */}
              <RecentSessions 
                sessions={sessionHistory || []} 
                isLoading={isLoadingSessionHistory}
                onRestartSession={() => {
                  refetchActiveSessions();
                  refetchSessionHistory();
                }}
              />
            </div>
          ) : (
            <JupyterInstance 
              session={activeSession!} 
              onBack={handleBackToDashboard} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

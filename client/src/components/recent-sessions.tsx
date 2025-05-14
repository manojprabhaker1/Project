import { Session } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Tool } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RecentSessionsProps {
  sessions: Session[];
  isLoading: boolean;
  onRestartSession: () => void;
}

export default function RecentSessions({ 
  sessions, 
  isLoading, 
  onRestartSession 
}: RecentSessionsProps) {
  const [restartingSessionId, setRestartingSessionId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch tools to get their names
  const { data: tools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });
  
  const getToolName = (toolId: number) => {
    const tool = tools?.find(t => t.id === toolId);
    return tool?.name || "Unknown Tool";
  };
  
  const getToolIcon = (toolId: number) => {
    const tool = tools?.find(t => t.id === toolId);
    return tool?.icon || "code";
  };
  
  const formatDuration = (startTime: Date, endTime: Date | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };
  
  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const isToday = sessionDate.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === sessionDate.toDateString();
    
    if (isToday) {
      return `Today, ${sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday, ${sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return `${sessionDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${sessionDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
  };
  
  const handleRestartSession = async (toolId: number) => {
    setRestartingSessionId(toolId);
    
    try {
      await apiRequest("POST", "/api/sessions", {
        toolId,
        status: "active",
      });
      
      toast({
        title: "Session restarted",
        description: "The tool has been launched successfully.",
      });
      
      onRestartSession();
    } catch (error) {
      toast({
        title: "Failed to restart session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setRestartingSessionId(null);
    }
  };

  // Display a loading state
  if (isLoading) {
    return (
      <div className="mt-8 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-secondary">Recent Sessions</h2>
          <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
            View all
          </a>
        </div>
        <div className="flex justify-center mt-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Filter to show only recent/completed sessions
  const recentSessions = sessions
    .filter(session => session.status !== 'active')
    .slice(0, 5);

  // Handle empty state
  if (recentSessions.length === 0) {
    return (
      <div className="mt-8 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-secondary">Recent Sessions</h2>
          <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
            View all
          </a>
        </div>
        <div className="mt-4 bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">No recent sessions found</p>
          <p className="text-sm text-gray-400 mt-2">Your session history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-secondary">Recent Sessions</h2>
        <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
          View all
        </a>
      </div>
      <div className="mt-4 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tool
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits Used
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSessions.map(session => (
                    <tr key={session.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                            <span className="material-icons text-sm text-primary">{getToolIcon(session.toolId)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{getToolName(session.toolId)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(new Date(session.startTime))}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDuration(new Date(session.startTime), session.endTime ? new Date(session.endTime) : null)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <span className="material-icons text-xs text-primary mr-1">toll</span>
                          {session.creditsUsed || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleRestartSession(session.toolId)}
                          disabled={restartingSessionId === session.toolId}
                          className="text-primary hover:text-primary/80"
                        >
                          {restartingSessionId === session.toolId ? 'Restarting...' : 'Restart'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

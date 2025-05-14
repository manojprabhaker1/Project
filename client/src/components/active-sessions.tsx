import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Session } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Tool } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SessionTimer } from "@/components/session-timer";

interface ActiveSessionsProps {
  activeSessions: Session[];
  isLoading: boolean;
  onOpenSession: (session: Session & { jupyterUrl?: string; token?: string }) => void;
  onEndSession: () => void;
}

export default function ActiveSessions({ 
  activeSessions, 
  isLoading, 
  onOpenSession,
  onEndSession 
}: ActiveSessionsProps) {
  const [endingSessionId, setEndingSessionId] = useState<number | null>(null);
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
  
  const handleOpenSession = async (session: Session) => {
    if (getToolName(session.toolId).toLowerCase().includes("jupyter")) {
      try {
        // Get Jupyter URL if this is a Jupyter session
        const res = await fetch(`/api/jupyter/status/${session.processId}`);
        const data = await res.json();
        
        if (data.status === "running") {
          onOpenSession({
            ...session,
            jupyterUrl: "http://localhost:8888",
            token: data.token
          });
        } else {
          toast({
            title: "Session not available",
            description: "The Jupyter session is no longer running.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error opening session",
          description: "Failed to connect to the Jupyter session.",
          variant: "destructive",
        });
      }
    } else {
      // For other tools, just pass the session
      onOpenSession(session);
    }
  };
  
  const handleEndSession = async (sessionId: number) => {
    setEndingSessionId(sessionId);
    
    try {
      await apiRequest("POST", `/api/sessions/${sessionId}/end`, {});
      
      toast({
        title: "Session ended",
        description: "The session has been terminated successfully.",
      });
      
      onEndSession();
    } catch (error) {
      toast({
        title: "Failed to end session",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setEndingSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-secondary">Active Sessions</h2>
        <div className="flex justify-center mt-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-secondary">Active Sessions</h2>
        <Card className="mt-4">
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No active sessions found</p>
            <p className="text-sm text-gray-400 mt-2">Launch a tool to get started</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-medium text-secondary">Active Sessions</h2>
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {activeSessions.map(session => (
            <li key={session.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                      <span className="material-icons text-primary">{getToolIcon(session.toolId)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-secondary">{getToolName(session.toolId)} Workspace</h3>
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-success">
                          Active
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Started {new Date(session.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-900 session-timer">Time Remaining</div>
                      <SessionTimer startTime={new Date(session.startTime)} toolId={session.toolId} />
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleOpenSession(session)}
                        className="flex items-center"
                      >
                        <span className="material-icons text-sm mr-1">launch</span>
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEndSession(session.id)}
                        disabled={endingSessionId === session.id}
                        className="ml-2 flex items-center"
                      >
                        {endingSessionId === session.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <span className="material-icons text-sm mr-1 text-gray-500">stop</span>
                        )}
                        Stop
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

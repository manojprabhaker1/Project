import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tool } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ToolCardProps {
  tool: Tool;
  userCredits: number;
  onSessionCreated: () => void;
}

export default function ToolCard({ tool, userCredits, onSessionCreated }: ToolCardProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const { toast } = useToast();

  const handleLaunch = async () => {
    if (userCredits < tool.creditsPerHour) {
      toast({
        title: "Insufficient credits",
        description: `You need ${tool.creditsPerHour} credits to launch this tool.`,
        variant: "destructive",
      });
      return;
    }

    setIsLaunching(true);
    try {
      await apiRequest("POST", "/api/sessions", {
        toolId: tool.id,
        status: "active",
      });
      
      toast({
        title: "Tool launched",
        description: `${tool.name} has been launched successfully.`,
      });
      
      onSessionCreated();
    } catch (error) {
      toast({
        title: "Launch failed",
        description: error instanceof Error ? error.message : "Failed to launch tool",
        variant: "destructive",
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow border border-gray-200 transition duration-150 card-hover">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
            <span className="material-icons text-primary">{tool.icon}</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-secondary">{tool.name}</h3>
            <p className="text-sm text-gray-500">{tool.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Cost per hour</span>
            <div className="flex items-center">
              <span className="material-icons text-sm text-primary mr-1">toll</span>
              <span className="font-medium">{tool.creditsPerHour} credits</span>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={handleLaunch}
              disabled={isLaunching || userCredits < tool.creditsPerHour}
              className="w-full flex items-center justify-center"
            >
              <span className="material-icons text-sm mr-2">play_arrow</span>
              {isLaunching ? "Launching..." : `Launch ${tool.name}`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

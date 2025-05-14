import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tool } from "@shared/schema";

interface SessionTimerProps {
  startTime: Date;
  toolId: number;
}

export function SessionTimer({ startTime, toolId }: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");
  const [isExpired, setIsExpired] = useState(false);

  // Fetch tool to get its credit cost per hour
  const { data: tools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  useEffect(() => {
    const getToolCredits = () => {
      if (!tools) return 1; // Default to 1 credit per hour if tools not loaded yet
      const tool = tools.find(t => t.id === toolId);
      return tool?.creditsPerHour || 1;
    };

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startTime);
      const creditsPerHour = getToolCredits();

      // Calculate the user's available credits (assuming 10 available - this would come from the user object in a real app)
      const availableCredits = 120; // This should be dynamically fetched from the user's profile

      // Calculate how many hours the user can afford with their available credits
      const affordableHours = availableCredits / creditsPerHour;
      
      // Calculate end time based on affordable hours
      const endTime = new Date(start.getTime() + (affordableHours * 60 * 60 * 1000));
      
      // Calculate time remaining
      const timeDiff = endTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeRemaining("00:00:00");
        setIsExpired(true);
        return;
      }
      
      // Convert to hours, minutes, seconds
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      // Format with leading zeros
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');
      
      setTimeRemaining(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };
    
    // Update immediately
    updateTimer();
    
    // Then update every second
    const intervalId = setInterval(updateTimer, 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [startTime, toolId, tools]);

  return (
    <div className={`mt-1 text-sm font-semibold session-timer ${isExpired ? 'text-destructive' : 'text-warning'}`}>
      {isExpired ? "Session Expired" : timeRemaining}
    </div>
  );
}

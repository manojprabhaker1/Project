import { useQuery } from "@tanstack/react-query";
import { CreditTransaction, Session } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Tool } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface UsageStatisticsProps {
  userId: number;
}

export default function UsageStatistics({ userId }: UsageStatisticsProps) {
  // Fetch credit transactions
  const { data: creditTransactions, isLoading: isLoadingTransactions } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/credits/history"],
    enabled: !!userId,
  });

  // Fetch session history
  const { data: sessionHistory, isLoading: isLoadingSessionHistory } = useQuery<Session[]>({
    queryKey: ["/api/sessions/history"],
    enabled: !!userId,
  });

  // Fetch tools to get their names
  const { data: tools } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const getToolName = (toolId: number) => {
    const tool = tools?.find(t => t.id === toolId);
    return tool?.name || "Unknown Tool";
  };

  // Calculate total credits used this month
  const calculateMonthlyCreditsUsed = () => {
    if (!creditTransactions) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return creditTransactions
      .filter(tx => new Date(tx.transactionTime) >= startOfMonth && tx.amount < 0)
      .reduce((total, tx) => total + Math.abs(tx.amount), 0);
  };

  // Calculate total session time this month (in hours)
  const calculateMonthlySessionTime = () => {
    if (!sessionHistory) return 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalMs = sessionHistory
      .filter(session => new Date(session.startTime) >= startOfMonth)
      .reduce((total, session) => {
        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : new Date();
        return total + (end.getTime() - start.getTime());
      }, 0);
    
    return +(totalMs / (1000 * 60 * 60)).toFixed(1); // Convert to hours and fix to 1 decimal
  };

  // Find the most used tool this month
  const findMostUsedTool = () => {
    if (!sessionHistory || !tools) return null;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const toolUsage = sessionHistory
      .filter(session => new Date(session.startTime) >= startOfMonth)
      .reduce((acc, session) => {
        const toolId = session.toolId;
        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : new Date();
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        acc[toolId] = (acc[toolId] || 0) + hours;
        return acc;
      }, {} as Record<number, number>);
    
    if (Object.keys(toolUsage).length === 0) return null;
    
    const mostUsedToolId = +Object.entries(toolUsage)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    const totalHours = Object.values(toolUsage).reduce((sum, hours) => sum + hours, 0);
    const percentage = Math.round((toolUsage[mostUsedToolId] / totalHours) * 100);
    
    return {
      name: getToolName(mostUsedToolId),
      hours: toolUsage[mostUsedToolId].toFixed(1),
      percentage
    };
  };

  // Loading state
  if (isLoadingTransactions || isLoadingSessionHistory) {
    return (
      <div className="mt-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-secondary">Usage Statistics</h2>
        <div className="flex justify-center mt-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const creditUsed = calculateMonthlyCreditsUsed();
  const sessionHours = calculateMonthlySessionTime();
  const mostUsedTool = findMostUsedTool();

  return (
    <div className="mt-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-lg font-medium text-secondary">Usage Statistics</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Credits Used Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <span className="material-icons text-primary">toll</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Credits Used This Month
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary">
                      {creditUsed} / 500
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <Progress value={(creditUsed / 500) * 100} className="h-2.5" />
              <p className="text-right mt-1 text-gray-500">{Math.round((creditUsed / 500) * 100)}% used</p>
            </div>
          </div>
        </div>

        {/* Session Time Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <span className="material-icons text-primary">timer</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Session Time This Month
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary">
                      {sessionHours} hours
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="flex justify-between text-sm text-gray-500">
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                View detailed usage
              </a>
              <span>+3.5 hrs from last month</span>
            </div>
          </div>
        </div>

        {/* Most Used Tool Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                <span className="material-icons text-primary">trending_up</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Most Used Tool
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-secondary">
                      {mostUsedTool ? `${mostUsedTool.name} (${mostUsedTool.hours} hrs)` : 'No data yet'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="flex justify-between text-sm text-gray-500">
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                View all tools
              </a>
              <span>{mostUsedTool ? `${mostUsedTool.percentage}% of total usage` : 'No usage data yet'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

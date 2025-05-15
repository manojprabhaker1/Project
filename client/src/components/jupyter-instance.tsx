import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Session } from "@shared/schema";

interface JupyterInstanceProps {
  session: Session & { jupyterUrl?: string; token?: string };
  onBack: () => void;
}

export default function JupyterInstance({ session, onBack }: JupyterInstanceProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle URL - construct from provided URL or fallback
  const hostname = window.location.hostname;
  const jupyterPort = 8888;
  const fallbackUrl = window.location.protocol + '//' + hostname;
  const jupyterUrl = session.jupyterUrl || fallbackUrl;
  const token = session.token || "";
  const iframeUrl = `${jupyterUrl}?token=${token}`;
  const apiUrl = `${window.location.protocol}//${hostname}`;
  
  // Log the URL we're trying to access for debugging
  console.log("Jupyter URL: ", jupyterUrl);
  
  // Check if the Jupyter server is ready
  useEffect(() => {
    const checkJupyterStatus = async () => {
      try {
        // Simple check to see if Jupyter is responding
        const response = await fetch(`${apiUrl}/api/jupyter/status/${session.id}?token=${token}`);
        
        if (response.ok) {
          setIsLoading(false);
          setError(null);
        } else {
          // If server responds but with an error
          setError("Jupyter server is not ready yet. Please wait...");
          setTimeout(checkJupyterStatus, 2000); // Try again in 2 seconds
        }
      } catch (err) {
        // If server doesn't respond at all
        setError("Connecting to Jupyter server...");
        setTimeout(checkJupyterStatus, 2000); // Try again in 2 seconds
      }
    };

    checkJupyterStatus();

    // Cleanup on unmount
    return () => {
      // Any cleanup needed when component unmounts
    };
  }, [jupyterUrl, token]);

  return (
    <div className="py-6 h-full flex flex-col">
      {/* Header with back button */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4 flex items-center">
        <Button variant="outline" onClick={onBack} className="mr-4">
          <span className="material-icons mr-2">arrow_back</span>
          Back to Dashboard
        </Button>
        <h1 className="text-xl font-semibold text-secondary">Jupyter Notebook Session</h1>
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {isLoading || error ? (
          <Card className="w-full h-full flex items-center justify-center">
            <CardContent className="flex flex-col items-center justify-center p-10">
              {isLoading && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg text-gray-700">Loading Jupyter Notebook...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
                </>
              )}
              
              {error && (
                <Alert className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="w-full h-full flex-1 overflow-hidden rounded-md border border-gray-200 shadow-sm">
            <iframe
              src={iframeUrl}
              title="Jupyter Notebook"
              className="w-full h-full"
              allow="clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            />
          </div>
        )}
      </div>
      
      {/* Footer with session information */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-gray-50 rounded-md p-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Session ID:</span> {session.id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Started:</span> {new Date(session.startTime).toLocaleString()}
            </p>
          </div>
          <Button variant="destructive" onClick={onBack}>
            <span className="material-icons mr-2">stop</span>
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
}

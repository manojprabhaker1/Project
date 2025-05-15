
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tool } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ToolManagement() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("code");
  const [creditsPerHour, setCreditsPerHour] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tools, isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("POST", "/api/admin/tools", {
        name,
        description,
        icon,
        creditsPerHour,
        isActive: true,
      });
      
      toast({
        title: "Success",
        description: "Tool added successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setName("");
      setDescription("");
      setIcon("code");
      setCreditsPerHour(1);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tool",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (toolId: number, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/tools/${toolId}`, { isActive });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({
        title: "Success",
        description: `Tool ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update tool",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Add New Tool</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Tool Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                placeholder="Icon (material-icons name)"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Credits per hour"
                value={creditsPerHour}
                onChange={(e) => setCreditsPerHour(parseInt(e.target.value))}
                required
                min="1"
              />
            </div>
            <Button type="submit">Add Tool</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Manage Tools</h3>
          {isLoading ? (
            <div>Loading tools...</div>
          ) : (
            <div className="space-y-4">
              {tools?.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">{tool.name}</h4>
                    <p className="text-sm text-gray-500">{tool.description}</p>
                    <p className="text-sm">Credits/hour: {tool.creditsPerHour}</p>
                  </div>
                  <Button
                    onClick={() => handleToggleActive(tool.id, !tool.isActive)}
                    variant={tool.isActive ? "destructive" : "default"}
                  >
                    {tool.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

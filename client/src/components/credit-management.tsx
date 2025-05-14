import { useState } from "react";
import { User } from "@shared/schema";
import { Loader2, Search } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CreditManagementProps {
  users: User[];
  isLoading: boolean;
  onCreditUpdate: () => void;
}

const addCreditSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive number"),
  description: z.string().min(2, "Description is required"),
});

export default function CreditManagement({ users, isLoading, onCreditUpdate }: CreditManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof addCreditSchema>>({
    resolver: zodResolver(addCreditSchema),
    defaultValues: {
      amount: 50,
      description: "Admin credit allocation",
    },
  });
  
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) || 
      user.displayName.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
  });
  
  const handleAddCreditsClick = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };
  
  const handleAddCredits = async (data: z.infer<typeof addCreditSchema>) => {
    if (!selectedUser) return;
    
    setIsAddingCredits(true);
    
    try {
      await apiRequest("POST", "/api/admin/credits", {
        userId: selectedUser.id,
        amount: data.amount,
        description: data.description,
      });
      
      toast({
        title: "Credits added",
        description: `${data.amount} credits have been added to ${selectedUser.displayName}'s account.`,
      });
      
      setIsDialogOpen(false);
      onCreditUpdate();
    } catch (error) {
      toast({
        title: "Failed to add credits",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  return (
    <div className="mt-8 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-medium text-secondary">Administration: Credit Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Allocate and manage credits for users in your organization
        </p>
        
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage credit allocations for each user</CardDescription>
            </div>
            <Button>
              <span className="material-icons mr-2 text-sm">add</span>
              Add User
            </Button>
          </CardHeader>
          
          <div className="border-t border-gray-200">
            <div className="px-4 py-3 bg-gray-50 flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits Available
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                        No users found matching your search
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                              {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <span className="material-icons text-xs text-primary mr-1">toll</span>
                            {user.credits}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.credits > 0 ? (
                            <Badge variant="outline" className="bg-green-100 text-success border-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-100 text-warning border-yellow-200">
                              No Credits
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleAddCreditsClick(user)}
                            className="text-primary hover:text-primary/80 mr-3"
                          >
                            Add Credits
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(filteredUsers.length, 10)}</span> of <span className="font-medium">{filteredUsers.length}</span> users
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      <span className="material-icons text-sm">chevron_left</span>
                    </a>
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </a>
                    <a href="#" className="relative inline-flex items-center px-4 py-2 border border-primary bg-primary text-sm font-medium text-white hover:bg-primary/90">
                      2
                    </a>
                    <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      <span className="material-icons text-sm">chevron_right</span>
                    </a>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Add Credits Dialog */}
      {selectedUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
              <DialogDescription>
                Add credits to {selectedUser.displayName}'s account.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddCredits)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
                    disabled={isAddingCredits}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddingCredits}>
                    {isAddingCredits ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Credits'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

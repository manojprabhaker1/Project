import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Loader2 } from "lucide-react";
import { User } from "@shared/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const addCreditSchema = z.object({
  amount: z.number().min(1),
  description: z.string().min(1),
});

const addUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  isAdmin: z.boolean(),
});

interface CreditManagementProps {
  users: User[];
  isLoading: boolean;
  onCreditUpdate: () => void;
}

export default function CreditManagement({ users, isLoading, onCreditUpdate }: CreditManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddingCredits, setIsAddingCredits] = useState(false);
  const { toast } = useToast();

  const creditForm = useForm<z.infer<typeof addCreditSchema>>({
    resolver: zodResolver(addCreditSchema),
    defaultValues: {
      amount: 50,
      description: "Admin credit allocation",
    },
  });

  const userForm = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
      isAdmin: false,
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
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const handleAddUser = async (data: z.infer<typeof addUserSchema>) => {
    try {
      await apiRequest("POST", "/api/admin/users", data);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsAddUserDialogOpen(false);
      onCreditUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-8 px-4 sm:px-6 lg:px-8 pb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage users and credit allocations</CardDescription>
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            Add User
          </Button>
        </CardHeader>

        <div className="p-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-4">User</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Credits</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="p-4">{user.displayName}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <Badge>{user.isAdmin ? "Admin" : "User"}</Badge>
                      </td>
                      <td className="p-4">{user.credits}</td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          className="mr-2"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDialogOpen(true);
                          }}
                        >
                          Add Credits
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
          </DialogHeader>
          <form onSubmit={creditForm.handleSubmit(handleAddCredits)}>
            <div className="space-y-4">
              <Input
                {...creditForm.register("amount", { valueAsNumber: true })}
                type="number"
                placeholder="Amount"
              />
              <Input
                {...creditForm.register("description")}
                placeholder="Description"
              />
              <Button type="submit" disabled={isAddingCredits}>
                {isAddingCredits ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Credits"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit(handleAddUser)}>
            <div className="space-y-4">
              <Input {...userForm.register("username")} placeholder="Username" />
              <Input {...userForm.register("email")} placeholder="Email" />
              <Input
                {...userForm.register("password")}
                type="password"
                placeholder="Password"
              />
              <Input
                {...userForm.register("displayName")}
                placeholder="Display Name"
              />
              <div className="flex items-center">
                <input
                  {...userForm.register("isAdmin")}
                  type="checkbox"
                  className="mr-2"
                />
                <label>Is Admin</label>
              </div>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
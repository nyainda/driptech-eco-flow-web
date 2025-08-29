import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Mail,
  Phone,
  MapPin,
  Building
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  user_role: string;
  created_at: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    user_role: "customer"
  });

  const userRoles = [
    { value: "customer", label: "Customer" },
    { value: "sales", label: "Sales" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" }
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const customerData = {
        ...formData,
        user_role: formData.user_role as "admin" | "manager" | "sales" | "customer"
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', editingCustomer.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Customer updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([customerData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Customer added successfully"
        });
      }

      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer deleted successfully"
      });
      
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      company_name: customer.company_name || "",
      contact_person: customer.contact_person,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
      user_role: customer.user_role
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      user_role: "customer"
    });
    setEditingCustomer(null);
    setShowAddForm(false);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || customer.user_role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Customer Management
          </h2>
          <p className="text-muted-foreground">
            Manage your customer relationships and contacts
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCustomer ? "Edit Customer" : "Add New Customer"}
            </CardTitle>
            <CardDescription>
              {editingCustomer ? "Update customer information" : "Enter customer details below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Contact Person *</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="Enter contact person name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="user_role">Role</Label>
                <Select value={formData.user_role} onValueChange={(value) => setFormData({ ...formData, user_role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {userRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-primary/10">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{customer.contact_person}</CardTitle>
                  {customer.company_name && (
                    <CardDescription className="flex items-center mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      {customer.company_name}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={customer.user_role === 'admin' ? 'default' : 'secondary'}>
                  {userRoles.find(r => r.value === customer.user_role)?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </div>
                
                {customer.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                
                {(customer.city || customer.country) && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {[customer.city, customer.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Joined: {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex justify-end space-x-1 mt-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEdit(customer)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(customer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedRole !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Get started by adding your first customer"}
            </p>
            {!searchTerm && selectedRole === "all" && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerManagement;
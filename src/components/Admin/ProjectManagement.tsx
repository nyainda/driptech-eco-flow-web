import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp,
  MapPin,
  Calendar,
  Users,
  Star,
  Camera,
  Upload,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  customer_id: string;
  quote_id: string;
  status: string;
  start_date: string;
  completion_date: string;
  location: string;
  project_type: string;
  area_covered: number;
  water_saved: number;
  yield_improvement: number;
  before_images: string[];
  after_images: string[];
  project_images: string[];
  testimonial: string;
  featured: boolean;
  created_at: string;
  customers: {
    contact_person: string;
    company_name: string;
  };
}

interface Customer {
  id: string;
  contact_person: string;
  company_name: string;
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    customer_id: "",
    project_type: "",
    location: "",
    area_covered: "",
    water_saved: "",
    yield_improvement: "",
    start_date: "",
    completion_date: "",
    testimonial: "",
    featured: false,
    status: "planning",
    project_images: [] as string[]
  });

  const [uploading, setUploading] = useState(false);

  const statusOptions = [
    { value: "planning", label: "Planning", color: "secondary" },
    { value: "in_progress", label: "In Progress", color: "default" },
    { value: "completed", label: "Completed", color: "default" },
    { value: "on_hold", label: "On Hold", color: "destructive" }
  ];

  const projectTypes = [
    "Greenhouse",
    "Open Field",
    "Orchard",
    "Vineyard",
    "Urban Landscaping",
    "Sports Field",
    "Residential Garden",
    "Commercial Farm"
  ];

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers (
            contact_person,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, contact_person, company_name')
        .order('contact_person');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        project_images: [...prev.project_images, ...uploadedUrls]
      }));

      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      project_images: prev.project_images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const projectData = {
        ...formData,
        area_covered: formData.area_covered ? parseFloat(formData.area_covered) : null,
        water_saved: formData.water_saved ? parseFloat(formData.water_saved) : null,
        yield_improvement: formData.yield_improvement ? parseFloat(formData.yield_improvement) : null,
        status: formData.status as "planning" | "in_progress" | "completed" | "on_hold",
        before_images: [],
        after_images: []
      };

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Project updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Project created successfully"
        });
      }

      resetForm();
      fetchProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      customer_id: project.customer_id || "",
      project_type: project.project_type || "",
      location: project.location || "",
      area_covered: project.area_covered?.toString() || "",
      water_saved: project.water_saved?.toString() || "",
      yield_improvement: project.yield_improvement?.toString() || "",
      start_date: project.start_date || "",
      completion_date: project.completion_date || "",
      testimonial: project.testimonial || "",
      featured: project.featured,
      status: project.status,
      project_images: project.project_images || []
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      customer_id: "",
      project_type: "",
      location: "",
      area_covered: "",
      water_saved: "",
      yield_improvement: "",
      start_date: "",
      completion_date: "",
      testimonial: "",
      featured: false,
      status: "planning",
      project_images: []
    });
    setEditingProject(null);
    setShowAddForm(false);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customers?.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">
            Manage your irrigation project portfolio and case studies
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </CardTitle>
            <CardDescription>
              {editingProject ? "Update project information" : "Enter project details and track progress"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.contact_person} - {customer.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter project location"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="area_covered">Area Covered (acres)</Label>
                  <Input
                    id="area_covered"
                    type="number"
                    step="0.1"
                    value={formData.area_covered}
                    onChange={(e) => setFormData({ ...formData, area_covered: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="water_saved">Water Saved (gallons)</Label>
                  <Input
                    id="water_saved"
                    type="number"
                    value={formData.water_saved}
                    onChange={(e) => setFormData({ ...formData, water_saved: e.target.value })}
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yield_improvement">Yield Improvement (%)</Label>
                  <Input
                    id="yield_improvement"
                    type="number"
                    step="0.1"
                    value={formData.yield_improvement}
                    onChange={(e) => setFormData({ ...formData, yield_improvement: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="completion_date">Completion Date</Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="testimonial">Customer Testimonial</Label>
                <Textarea
                  id="testimonial"
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  placeholder="Customer feedback and testimonial"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Project Images</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={uploading} asChild>
                      <div>
                        <Camera className="mr-2 h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Images"}
                      </div>
                    </Button>
                  </Label>
                </div>

                {formData.project_images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.project_images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured Project (show in portfolio)</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? "Update Project" : "Create Project"}
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
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {project.name}
                    {project.featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </CardTitle>
                  {project.customers && (
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {project.customers.contact_person}
                      {project.customers.company_name && ` - ${project.customers.company_name}`}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={statusOptions.find(s => s.value === project.status)?.color as any}>
                  {statusOptions.find(s => s.value === project.status)?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{project.location}</span>
                  </div>
                )}
                
                {project.project_type && (
                  <div className="flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{project.project_type}</span>
                    {project.area_covered && <span className="ml-2">({project.area_covered} acres)</span>}
                  </div>
                )}
                
                {(project.start_date || project.completion_date) && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {project.start_date && new Date(project.start_date).toLocaleDateString()}
                      {project.start_date && project.completion_date && " - "}
                      {project.completion_date && new Date(project.completion_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {(project.water_saved || project.yield_improvement) && (
                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
                    {project.water_saved && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {project.water_saved.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Gallons Saved</div>
                      </div>
                    )}
                    {project.yield_improvement && (
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          +{project.yield_improvement}%
                        </div>
                        <div className="text-xs text-muted-foreground">Yield Improvement</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Camera className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedStatus !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Get started by creating your first project"}
            </p>
            {!searchTerm && selectedStatus === "all" && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectManagement;
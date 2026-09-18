import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Star, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Technician {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    profile_image_url?: string;
    bio?: string;
    specializations: string[];
    certifications: string[];
    years_experience?: number;
    rating: number;
    total_reviews: number;
    total_jobs_completed: number;
    is_active: boolean;
    service_areas: string[];
}

const TechnicianManagement = () => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        bio: "",
        specializations: "",
        certifications: "",
        years_experience: "",
        service_areas: "",
        is_active: true,
    });

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from("technicians")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error("Error fetching technicians:", error);
            toast({
                title: "Error",
                description: "Failed to load technicians",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (technician: Technician) => {
        setEditingTechnician(technician);
        setFormData({
            full_name: technician.full_name,
            email: technician.email || "",
            phone: technician.phone,
            bio: technician.bio || "",
            specializations: technician.specializations.join(", "),
            certifications: technician.certifications.join(", "),
            years_experience: technician.years_experience?.toString() || "",
            service_areas: technician.service_areas.join(", "),
            is_active: technician.is_active,
        });
        setShowDialog(true);
    };

    const handleAdd = () => {
        setEditingTechnician(null);
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            bio: "",
            specializations: "",
            certifications: "",
            years_experience: "",
            service_areas: "",
            is_active: true,
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            const technicianData = {
                full_name: formData.full_name,
                email: formData.email || null,
                phone: formData.phone,
                bio: formData.bio || null,
                specializations: formData.specializations
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                certifications: formData.certifications
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                years_experience: formData.years_experience
                    ? parseInt(formData.years_experience)
                    : null,
                service_areas: formData.service_areas
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                is_active: formData.is_active,
            };

            if (editingTechnician) {
                const { error } = await supabase
                    .from("technicians")
                    .update(technicianData)
                    .eq("id", editingTechnician.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Technician updated successfully",
                });
            } else {
                const { error } = await supabase
                    .from("technicians")
                    .insert([technicianData]);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Technician added successfully",
                });
            }

            setShowDialog(false);
            fetchTechnicians();
        } catch (error) {
            console.error("Error saving technician:", error);
            toast({
                title: "Error",
                description: "Failed to save technician",
                variant: "destructive",
            });
        }
    };

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("technicians")
                .update({ is_active: !currentStatus })
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Technician ${!currentStatus ? "activated" : "deactivated"}`,
            });

            fetchTechnicians();
        } catch (error) {
            console.error("Error toggling technician status:", error);
            toast({
                title: "Error",
                description: "Failed to update technician status",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Technician Management</h2>
                    <p className="text-muted-foreground">
                        Manage your team of irrigation technicians
                    </p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Technician
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Technicians ({technicians.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading technicians...</div>
                    ) : technicians.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No technicians found. Add your first technician to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Specializations</TableHead>
                                    <TableHead>Experience</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Jobs</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {technicians.map((tech) => (
                                    <TableRow key={tech.id}>
                                        <TableCell>
                                            <div className="font-medium">{tech.full_name}</div>
                                            {tech.service_areas.length > 0 && (
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {tech.service_areas.slice(0, 2).join(", ")}
                                                    {tech.service_areas.length > 2 && ` +${tech.service_areas.length - 2}`}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Phone className="h-3 w-3" />
                                                    {tech.phone}
                                                </div>
                                                {tech.email && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        {tech.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {tech.specializations.slice(0, 2).map((spec, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {spec}
                                                    </Badge>
                                                ))}
                                                {tech.specializations.length > 2 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{tech.specializations.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tech.years_experience ? `${tech.years_experience} years` : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">
                                                    {tech.rating.toFixed(1)}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    ({tech.total_reviews})
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{tech.total_jobs_completed}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={tech.is_active}
                                                onCheckedChange={() => toggleActive(tech.id, tech.is_active)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(tech)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTechnician ? "Edit Technician" : "Add New Technician"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTechnician
                                ? "Update technician information"
                                : "Add a new technician to your team"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    placeholder="0712345678"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) =>
                                    setFormData({ ...formData, bio: e.target.value })
                                }
                                placeholder="Brief description of the technician's background..."
                                className="min-h-[80px]"
                            />
                        </div>

                        <div>
                            <Label htmlFor="specializations">
                                Specializations (comma-separated)
                            </Label>
                            <Input
                                id="specializations"
                                value={formData.specializations}
                                onChange={(e) =>
                                    setFormData({ ...formData, specializations: e.target.value })
                                }
                                placeholder="drip irrigation, sprinkler systems, smart controllers"
                            />
                        </div>

                        <div>
                            <Label htmlFor="certifications">
                                Certifications (comma-separated)
                            </Label>
                            <Input
                                id="certifications"
                                value={formData.certifications}
                                onChange={(e) =>
                                    setFormData({ ...formData, certifications: e.target.value })
                                }
                                placeholder="Certified Irrigation Technician, Pump Specialist"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="years_experience">Years of Experience</Label>
                                <Input
                                    id="years_experience"
                                    type="number"
                                    value={formData.years_experience}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            years_experience: e.target.value,
                                        })
                                    }
                                    placeholder="5"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked })
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="service_areas">
                                Service Areas (comma-separated)
                            </Label>
                            <Input
                                id="service_areas"
                                value={formData.service_areas}
                                onChange={(e) =>
                                    setFormData({ ...formData, service_areas: e.target.value })
                                }
                                placeholder="Nairobi, Kiambu, Machakos"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                {editingTechnician ? "Update" : "Add"} Technician
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TechnicianManagement;

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Eye,
    UserCheck,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ServiceBooking {
    id: string;
    booking_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_type: string;
    location_address: string;
    farm_name?: string;
    preferred_date?: string;
    preferred_time_slot?: string;
    scheduled_date?: string;
    status: string;
    priority: string;
    service_description?: string;
    special_requirements?: string;
    assigned_technician_id?: string;
    created_at: string;
    service_categories?: { name: string; slug: string };
    technicians?: { full_name: string; phone: string };
}

interface Technician {
    id: string;
    full_name: string;
    phone: string;
    is_active: boolean;
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    assigned: "bg-purple-500",
    in_progress: "bg-orange-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
};

const priorityColors: Record<string, string> = {
    low: "bg-gray-500",
    normal: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
};

const ServiceBookingManagement = () => {
    const [bookings, setBookings] = useState<ServiceBooking[]>([]);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
    const [internalNotes, setInternalNotes] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const { toast } = useToast();

    useEffect(() => {
        fetchBookings();
        fetchTechnicians();
    }, [filterStatus]);

    const fetchBookings = async () => {
        try {
            const filters: any = {};
            if (filterStatus !== "all") {
                filters.status = filterStatus;
            }

            const data = await dataService.getServiceBookings(filters);
            setBookings(data || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "Error",
                description: "Failed to load bookings",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from("technicians")
                .select("id, full_name, phone, is_active")
                .eq("is_active", true)
                .order("full_name");

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error("Error fetching technicians:", error);
        }
    };

    const handleViewDetails = (booking: ServiceBooking) => {
        setSelectedBooking(booking);
        setShowDetailsDialog(true);
    };

    const handleAssignTechnician = (booking: ServiceBooking) => {
        setSelectedBooking(booking);
        setSelectedTechnicianId(booking.assigned_technician_id || "");
        setShowAssignDialog(true);
    };

    const submitAssignment = async () => {
        if (!selectedBooking || !selectedTechnicianId) return;

        try {
            const { error } = await supabase
                .from("service_bookings")
                .update({
                    assigned_technician_id: selectedTechnicianId,
                    status: "assigned",
                    assigned_at: new Date().toISOString(),
                })
                .eq("id", selectedBooking.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Technician assigned successfully",
            });

            setShowAssignDialog(false);
            fetchBookings();
        } catch (error) {
            console.error("Error assigning technician:", error);
            toast({
                title: "Error",
                description: "Failed to assign technician",
                variant: "destructive",
            });
        }
    };

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        try {
            const updateData: any = { status: newStatus };

            if (newStatus === "completed") {
                updateData.completed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from("service_bookings")
                .update(updateData)
                .eq("id", bookingId);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Booking status updated to ${newStatus}`,
            });

            fetchBookings();
        } catch (error) {
            console.error("Error updating booking status:", error);
            toast({
                title: "Error",
                description: "Failed to update booking status",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        return (
            <Badge className={`${statusColors[status]} text-white`}>
                {status.replace("_", " ").toUpperCase()}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        return (
            <Badge variant="outline" className={`${priorityColors[priority]} text-white border-0`}>
                {priority.toUpperCase()}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Service Booking Management</h2>
                    <p className="text-muted-foreground">
                        Manage customer service requests and technician assignments
                    </p>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Bookings</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Pending", status: "pending", icon: Clock },
                    { label: "Assigned", status: "assigned", icon: UserCheck },
                    { label: "In Progress", status: "in_progress", icon: Calendar },
                    { label: "Completed", status: "completed", icon: CheckCircle },
                ].map((stat) => {
                    const count = bookings.filter((b) => b.status === stat.status).length;
                    return (
                        <Card key={stat.status}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold">{count}</p>
                                    </div>
                                    <stat.icon className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Bookings ({bookings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No bookings found
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Booking #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-mono text-sm">
                                            {booking.booking_number}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{booking.customer_name}</div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {booking.customer_phone}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {booking.service_categories?.name || booking.service_type}
                                                </div>
                                                {booking.farm_name && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {booking.farm_name}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {booking.preferred_date ? (
                                                <div>
                                                    <div>{format(new Date(booking.preferred_date), "MMM dd, yyyy")}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {booking.preferred_time_slot}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Not set</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getPriorityBadge(booking.priority)}</TableCell>
                                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                        <TableCell>
                                            {booking.technicians ? (
                                                <div>
                                                    <div className="font-medium">{booking.technicians.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {booking.technicians.phone}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAssignTechnician(booking)}
                                                >
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Assign
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(booking)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {booking.status !== "completed" && booking.status !== "cancelled" && (
                                                    <Select
                                                        value={booking.status}
                                                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                                                    >
                                                        <SelectTrigger className="w-32 h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                                            <SelectItem value="assigned">Assigned</SelectItem>
                                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Booking Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Booking Details - {selectedBooking?.booking_number}</DialogTitle>
                    </DialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Customer Name</Label>
                                    <p className="font-medium">{selectedBooking.customer_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedBooking.customer_phone}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedBooking.customer_email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Service Type</Label>
                                    <p className="font-medium">
                                        {selectedBooking.service_categories?.name || selectedBooking.service_type}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground">Location</Label>
                                <p className="font-medium">{selectedBooking.location_address}</p>
                                {selectedBooking.farm_name && (
                                    <p className="text-sm text-muted-foreground">Farm: {selectedBooking.farm_name}</p>
                                )}
                            </div>

                            {selectedBooking.service_description && (
                                <div>
                                    <Label className="text-muted-foreground">Service Description</Label>
                                    <p className="text-sm">{selectedBooking.service_description}</p>
                                </div>
                            )}

                            {selectedBooking.special_requirements && (
                                <div>
                                    <Label className="text-muted-foreground">Special Requirements</Label>
                                    <p className="text-sm">{selectedBooking.special_requirements}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Priority</Label>
                                    <div className="mt-1">{getPriorityBadge(selectedBooking.priority)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Assign Technician Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Technician</DialogTitle>
                        <DialogDescription>
                            Select a technician for booking {selectedBooking?.booking_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Select Technician</Label>
                            <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a technician" />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            {tech.full_name} - {tech.phone}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={submitAssignment} disabled={!selectedTechnicianId}>
                                Assign Technician
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ServiceBookingManagement;

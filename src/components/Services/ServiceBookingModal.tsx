import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { dataService } from "@/services/dataService";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ServiceBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedService: any | null; // using any to match the loose typing if needed, but preferably strict
}

const ServiceBookingModal = ({ isOpen, onClose, preselectedService }: ServiceBookingModalProps) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [date, setDate] = useState<Date>();

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        location: "",
        description: "",
        farmName: "",
        farmSize: "",
        timeSlot: "morning",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (preselectedService) {
                // Create a formal service booking
                await dataService.createServiceBooking({
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    service_category_id: preselectedService.id,
                    service_type: preselectedService.slug,
                    service_description: formData.description,
                    location_address: formData.location,
                    farm_name: formData.farmName || undefined,
                    farm_size_acres: formData.farmSize ? parseFloat(formData.farmSize) : undefined,
                    preferred_date: date ? date.toISOString() : undefined,
                    preferred_time_slot: formData.timeSlot,
                    special_requirements: formData.description,
                });
            } else {
                // General inquiry / technician request
                const { error } = await supabase
                    .from("contact_submissions")
                    .insert([
                        {
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone,
                            company: formData.farmName || "Individual",
                            message: `Technician Booking Request
Location: ${formData.location}
Farm: ${formData.farmName || "N/A"} (${formData.farmSize || 0} acres)
Preferred Date: ${date ? format(date, "PPP") : "Not specified"}
Time: ${formData.timeSlot}

Description: ${formData.description}`,
                            project_type: "technician_service",
                            status: "new",
                            area_size: formData.farmSize ? `${formData.farmSize} acres` : undefined,
                        },
                    ]);
                if (error) throw error;
            }

            toast({
                title: "Booking Request Sent",
                description: "We have received your booking request and will contact you shortly to confirm.",
            });

            onClose();
            setFormData({
                name: "",
                phone: "",
                email: "",
                location: "",
                description: "",
                farmName: "",
                farmSize: "",
                timeSlot: "morning",
            });
            setDate(undefined);

        } catch (error: any) {
            console.error("Error submitting booking:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit booking request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Book a Technician</DialogTitle>
                    <DialogDescription>
                        {preselectedService
                            ? `Booking request for ${preselectedService.name}. Fill in your details below.`
                            : "Fill in your details to book a certified irrigation technician."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="07XX XXX XXX"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="farmName">Farm Name (Optional)</Label>
                            <Input
                                id="farmName"
                                value={formData.farmName}
                                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                                placeholder="Green Acres"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="farmSize">Farm Size (Acres)</Label>
                            <Input
                                id="farmSize"
                                type="number"
                                min="0"
                                step="0.1"
                                value={formData.farmSize}
                                onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                                placeholder="e.g. 5"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="location">Location / Address *</Label>
                        <Input
                            id="location"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Karen, Nairobi"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Preferred Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                        disabled={(date) => date < new Date()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="timeSlot">Preferred Time</Label>
                            <select
                                id="timeSlot"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.timeSlot}
                                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                            >
                                <option value="morning">Morning (8am - 12pm)</option>
                                <option value="afternoon">Afternoon (1pm - 5pm)</option>
                                <option value="anytime">Anytime</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Issue Description / Notes</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the issue or service needed..."
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ServiceBookingModal;

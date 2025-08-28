import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduleConsultationProps {
  children: React.ReactNode;
}

const ScheduleConsultation = ({ children }: ScheduleConsultationProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    consultation_type: "",
    preferred_time: "",
    project_details: "",
    area_size: "",
    budget_range: ""
  });

  const consultationTypes = [
    "System Design Consultation",
    "Site Assessment",
    "Technical Support",
    "Product Recommendation",
    "Installation Planning",
    "Maintenance Review",
    "Efficiency Audit",
    "Training Session"
  ];

  const timeSlots = [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM", 
    "11:00 AM - 12:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM"
  ];

  const budgetRanges = [
    "Under KSh 500,000",
    "KSh 500,000 - 1,000,000",
    "KSh 1,000,000 - 2,500,000",
    "KSh 2,500,000 - 5,000,000",
    "Above KSh 5,000,000"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !formData.preferred_time || !formData.consultation_type) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including date and time.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const consultationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        message: `Consultation Request:
        
Type: ${formData.consultation_type}
Preferred Date: ${format(selectedDate, 'PPP')}
Preferred Time: ${formData.preferred_time}
Project Details: ${formData.project_details}
Area Size: ${formData.area_size}
Budget Range: ${formData.budget_range}
Location: ${formData.location}`,
        project_type: formData.consultation_type,
        area_size: formData.area_size,
        budget_range: formData.budget_range,
        status: 'pending',
        read: false
      };

      const { error } = await supabase
        .from('contact_submissions')
        .insert([consultationData]);

      if (error) throw error;

      toast({
        title: "Consultation Scheduled!",
        description: "We'll contact you within 24 hours to confirm your appointment.",
      });

      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        location: "",
        consultation_type: "",
        preferred_time: "",
        project_details: "",
        area_size: "",
        budget_range: ""
      });
      setSelectedDate(undefined);

    } catch (error) {
      console.error('Error scheduling consultation:', error);
      toast({
        title: "Error",
        description: "Failed to schedule consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Schedule Your Consultation
          </DialogTitle>
          <DialogDescription>
            Book a personalized consultation with our irrigation experts to discuss your project needs and get professional recommendations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Project Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, County"
                />
              </div>
              <div>
                <Label htmlFor="area_size">Area Size</Label>
                <Input
                  id="area_size"
                  value={formData.area_size}
                  onChange={(e) => handleInputChange('area_size', e.target.value)}
                  placeholder="e.g., 10 acres, 5 hectares"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="budget_range">Budget Range</Label>
              <Select value={formData.budget_range} onValueChange={(value) => handleInputChange('budget_range', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map(range => (
                    <SelectItem key={range} value={range}>{range}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Consultation Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Consultation Preferences
            </h3>
            <div>
              <Label htmlFor="consultation_type">Consultation Type *</Label>
              <Select value={formData.consultation_type} onValueChange={(value) => handleInputChange('consultation_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select consultation type" />
                </SelectTrigger>
                <SelectContent>
                  {consultationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Preferred Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) =>
                        date < new Date() || date.getDay() === 0 || date.getDay() === 6
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="preferred_time">Preferred Time *</Label>
                <Select value={formData.preferred_time} onValueChange={(value) => handleInputChange('preferred_time', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <Label htmlFor="project_details">Project Details & Specific Requirements</Label>
            <Textarea
              id="project_details"
              value={formData.project_details}
              onChange={(e) => handleInputChange('project_details', e.target.value)}
              placeholder="Please describe your irrigation needs, challenges, or specific requirements..."
              className="min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule Consultation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleConsultation;
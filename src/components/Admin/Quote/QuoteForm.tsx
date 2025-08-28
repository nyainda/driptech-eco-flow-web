
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Quote, QuoteStatus, Customer } from "@/types/Quote";

interface QuoteFormProps {
  quote?: Quote | null;
  customer?: Customer | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  includeVat: boolean;
  setIncludeVat: (include: boolean) => void;
  vatRate: number;
  setVatRate: (rate: number) => void;
  date?: DateRange;
  setDate: (date: DateRange | undefined) => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  quote,
  customer,
  onSubmit,
  onCancel,
  includeVat,
  setIncludeVat,
  vatRate,
  setVatRate,
  date,
  setDate
}) => {
  const [formData, setFormData] = useState({
    project_type: quote?.project_type || "",
    crop_type: quote?.crop_type || "",
    area_size: quote?.area_size?.toString() || "",
    water_source: quote?.water_source || "",
    terrain_info: quote?.terrain_info || "",
    notes: quote?.notes || "",
    status: quote?.status || "draft" as QuoteStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      area_size: parseFloat(formData.area_size) || undefined,
      customer_id: customer?.id,
      include_vat: includeVat,
      vat_rate: vatRate,
      valid_until: date?.to?.toISOString(),
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote Details</CardTitle>
        <CardDescription>Enter the quote details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_type">Project Type</Label>
              <Input
                id="project_type"
                value={formData.project_type}
                onChange={(e) => handleInputChange('project_type', e.target.value)}
                placeholder="e.g., Greenhouse Irrigation"
              />
            </div>
            <div>
              <Label htmlFor="crop_type">Crop Type</Label>
              <Input
                id="crop_type"
                value={formData.crop_type}
                onChange={(e) => handleInputChange('crop_type', e.target.value)}
                placeholder="e.g., Tomatoes"
              />
            </div>
            <div>
              <Label htmlFor="area_size">Area Size (acres)</Label>
              <Input
                type="number"
                step="0.1"
                id="area_size"
                value={formData.area_size}
                onChange={(e) => handleInputChange('area_size', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="water_source">Water Source</Label>
              <Input
                id="water_source"
                value={formData.water_source}
                onChange={(e) => handleInputChange('water_source', e.target.value)}
                placeholder="e.g., Borehole, River"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="terrain_info">Terrain Information</Label>
            <Textarea
              id="terrain_info"
              value={formData.terrain_info}
              onChange={(e) => handleInputChange('terrain_info', e.target.value)}
              placeholder="Describe the terrain and soil conditions"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information or special requirements"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
                      ) : (
                        format(date.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VAT Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_vat"
                checked={includeVat}
                onCheckedChange={(checked) => setIncludeVat(checked as boolean)}
              />
              <Label htmlFor="include_vat" className="text-sm font-medium">
                Include VAT
              </Label>
            </div>
            {includeVat && (
              <div>
                <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                <Input
                  type="number"
                  id="vat_rate"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {quote ? "Update Quote" : "Create Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;

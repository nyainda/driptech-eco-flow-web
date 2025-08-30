import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Eye, Edit, Save, X, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuotePDF } from "./QuotePDF";

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

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

interface Quote {
  id: string;
  quote_number: string;
  customer_id?: string;
  project_type?: string;
  crop_type?: string;
  area_size?: number;
  water_source?: string;
  terrain_info?: string;
  notes?: string;
  total_amount?: number;
  status: QuoteStatus;
  valid_until?: string;
  include_vat: boolean;
  vat_rate?: number;
  created_at: string;
}

interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

const QuoteManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState(16);
  const [newQuoteItem, setNewQuoteItem] = useState<Omit<QuoteItem, 'id' | 'total'>>({
    name: '',
    description: '',
    quantity: 1,
    unit: 'unit',
    unit_price: 0,
  });
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  })

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name', { ascending: true });
      
      if (error) throw error;
      return data as Customer[];
    }
  });

  // Fetch quotes
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as any[]).map((q) => ({
        ...q,
        include_vat: q.include_vat ?? true,
        vat_rate: q.vat_rate ?? 16,
        total_amount: q.total_amount ?? 0,
      })) as Quote[];
    }
  });

  // Save quote mutation
  const saveQuoteMutation = useMutation({
    mutationFn: async (quote: Partial<Quote>) => {
      if (quote.id) {
        // Update existing quote
        const { data, error } = await supabase
          .from('quotes')
          .update({
            customer_id: quote.customer_id,
            project_type: quote.project_type,
            crop_type: quote.crop_type,
            area_size: quote.area_size,
            water_source: quote.water_source,
            terrain_info: quote.terrain_info,
            notes: quote.notes,
            status: quote.status || 'draft' as QuoteStatus,
            valid_until: quote.valid_until,
            total_amount: quote.total_amount,
            include_vat: quote.include_vat,
            vat_rate: quote.vat_rate,
          })
          .eq('id', quote.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new quote
        const { data, error } = await supabase
          .from('quotes')
          .insert({
            quote_number: `QT-${Date.now()}`,
            customer_id: quote.customer_id,
            project_type: quote.project_type,
            crop_type: quote.crop_type,
            area_size: quote.area_size,
            water_source: quote.water_source,
            terrain_info: quote.terrain_info,
            notes: quote.notes,
            status: (quote.status || 'draft') as QuoteStatus,
            valid_until: quote.valid_until,
            total_amount: quote.total_amount,
            include_vat: quote.include_vat,
            vat_rate: quote.vat_rate,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      
      // Save quote items
      saveQuoteItemsMutation.mutate({
        quoteId: newQuote.id,
        items: quoteItems,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save quote items mutation
  const saveQuoteItemsMutation = useMutation({
    mutationFn: async ({ quoteId, items }: { quoteId: string, items: QuoteItem[] }) => {
      // Delete existing quote items
      const { error: deleteError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId);
      
      if (deleteError) throw deleteError;

      // Insert new quote items
      const quoteItemsToInsert = items.map(item => ({
        quote_id: quoteId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitprice: item.unit_price,
        total: item.total,
      }));

      const { data, error } = await supabase
        .from('quote_items')
        .insert(quoteItemsToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setShowForm(false);
      setSelectedQuote(null);
      setQuoteItems([]);
      setSelectedCustomer(null);
      toast({
        title: "Success",
        description: "Quote saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete quote mutation
  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveQuote = (quote: Partial<Quote>) => {
    const validUntilDate = date?.to instanceof Date ? date.to.toISOString() : undefined;
    saveQuoteMutation.mutate({ 
      ...quote, 
      valid_until: validUntilDate,
      customer_id: selectedCustomer?.id,
      total_amount: totalAmount,
      include_vat: includeVat,
      vat_rate: vatRate,
    });
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuoteMutation.mutate(quoteId);
    }
  };

  const handleEditQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    
    // Set VAT options
    setIncludeVat(quote.include_vat ?? true);
    setVatRate(quote.vat_rate ?? 16);
    
    // Set the date range for the calendar
    setDate({
      from: new Date(quote.created_at),
      to: quote.valid_until ? new Date(quote.valid_until) : undefined,
    });

    // Fetch customer if available
    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single();
      
      setSelectedCustomer(customer);
    }
    
    // Fetch quote items
    supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id)
      .then(({ data, error }) => {
        if (error) throw error;
        
        // Map database fields to component interface
        const mappedItems: QuoteItem[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitprice, // Map unitprice to unit_price
          total: item.total
        }));

        setQuoteItems(mappedItems);
        setShowForm(true);
      });
  };

  const handleNewQuote = () => {
    setSelectedQuote(null);
    setQuoteItems([]);
    setSelectedCustomer(null);
    setIncludeVat(true);
    setVatRate(16);
    setShowForm(true);
  };

  const handleAddItem = () => {
    const total = newQuoteItem.quantity * newQuoteItem.unit_price;
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      ...newQuoteItem,
      total,
    };
    setQuoteItems([...quoteItems, newItem]);
    setNewQuoteItem({
      name: '',
      description: '',
      quantity: 1,
      unit: 'unit',
      unit_price: 0,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(quoteItems.filter(item => item.id !== itemId));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewQuoteItem({
      ...newQuoteItem,
      [name]: value,
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const quantity = parseInt(value);
    if (isNaN(quantity)) {
      setNewQuoteItem({
        ...newQuoteItem,
        [name]: 1,
      });
    } else {
      setNewQuoteItem({
        ...newQuoteItem,
        [name]: quantity,
      });
    }
  };

  // Inline editing functions
  const handleStartEdit = (item: QuoteItem) => {
    setEditingItemId(item.id);
    setEditingItem({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingItem(null);
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      const updatedTotal = editingItem.quantity * editingItem.unit_price;
      const updatedItem = { ...editingItem, total: updatedTotal };
      
      setQuoteItems(quoteItems.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      
      setEditingItemId(null);
      setEditingItem(null);
    }
  };

  const handleEditItemChange = (field: keyof QuoteItem, value: string | number) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [field]: value,
      });
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
    toast({
      title: "Customer Selected",
      description: `${customer.company_name} has been added to the quote`,
    });
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const tax = includeVat ? subtotal * (vatRate / 100) : 0;
  const totalAmount = subtotal + tax;

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<Quote | null>(null);
  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedCustomerForPDF, setSelectedCustomerForPDF] = useState<Customer | null>(null);

  const handleViewPDF = async (quote: Quote) => {
    setSelectedQuoteForPDF(quote);
    
    // Fetch quote items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);
    
    if (itemsError) {
      toast({
        title: "Error",
        description: "Failed to load quote items",
        variant: "destructive",
      });
      return;
    }

    // Map database fields to component interface
    const mappedItems: QuoteItem[] = (items || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitprice, // Map unitprice to unit_price
      total: item.total
    }));

    setSelectedQuoteItems(mappedItems);
    
    // Fetch customer if available
    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', quote.customer_id)
        .single();
      
      setSelectedCustomerForPDF(customer);
    }
    
    setShowPDFPreview(true);
  };

  const handleEditFromPDF = () => {
    if (selectedQuoteForPDF) {
      setSelectedQuote(selectedQuoteForPDF);
      setQuoteItems(selectedQuoteItems);
      setSelectedCustomer(selectedCustomerForPDF);
      setShowPDFPreview(false);
      setShowForm(true);
    }
  };

  if (showPDFPreview && selectedQuoteForPDF) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowPDFPreview(false)}>
            ← Back to Quotes
          </Button>
          <h2 className="text-2xl font-bold">Quote PDF Preview</h2>
        </div>
        
        <QuotePDF 
          quote={{
            ...selectedQuoteForPDF,
            vat_rate: selectedQuoteForPDF.vat_rate ?? 16 
          }}
          items={selectedQuoteItems}
          customer={selectedCustomerForPDF || undefined}
          onEdit={handleEditFromPDF}
        />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            ← Back to Quotes
          </Button>
          <h2 className="text-2xl font-bold">{selectedQuote ? 'Edit Quote' : 'New Quote'}</h2>
        </div>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select or view customer details</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedCustomer.company_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.contact_person} • {selectedCustomer.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.phone} • {selectedCustomer.city}, {selectedCustomer.country}
                    </p>
                  </div>
                  <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Change Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Select Customer</DialogTitle>
                        <DialogDescription>Choose a customer for this quote</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {customersLoading ? (
                          <div>Loading customers...</div>
                        ) : (
                          customers.map((customer) => (
                            <Card key={customer.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectCustomer(customer)}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold">{customer.company_name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {customer.contact_person} • {customer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {customer.city}, {customer.country}
                                    </p>
                                  </div>
                                  {selectedCustomer?.id === customer.id && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Select Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Customer</DialogTitle>
                    <DialogDescription>Choose a customer for this quote</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {customersLoading ? (
                      <div>Loading customers...</div>
                    ) : (
                      customers.map((customer) => (
                        <Card key={customer.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectCustomer(customer)}>
                          <CardContent className="p-4">
                            <div>
                              <h4 className="font-semibold">{customer.company_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {customer.contact_person} • {customer.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {customer.city}, {customer.country}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
            <CardDescription>Enter the quote details below</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_type">Project Type</Label>
                <Input
                  id="project_type"
                  defaultValue={selectedQuote?.project_type}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, project_type: e.target.value } as Quote)}
                />
              </div>
              <div>
                <Label htmlFor="crop_type">Crop Type</Label>
                <Input
                  id="crop_type"
                  defaultValue={selectedQuote?.crop_type}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, crop_type: e.target.value } as Quote)}
                />
              </div>
              <div>
                <Label htmlFor="area_size">Area Size (acres)</Label>
                <Input
                  type="number"
                  id="area_size"
                  defaultValue={selectedQuote?.area_size}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, area_size: parseFloat(e.target.value) } as Quote)}
                />
              </div>
              <div>
                <Label htmlFor="water_source">Water Source</Label>
                <Input
                  id="water_source"
                  defaultValue={selectedQuote?.water_source}
                  onChange={(e) => setSelectedQuote({ ...selectedQuote, water_source: e.target.value } as Quote)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="terrain_info">Terrain Info</Label>
              <Textarea
                id="terrain_info"
                defaultValue={selectedQuote?.terrain_info}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, terrain_info: e.target.value } as Quote)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                defaultValue={selectedQuote?.notes}
                onChange={(e) => setSelectedQuote({ ...selectedQuote, notes: e.target.value } as Quote)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Valid Until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
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
                  value={selectedQuote?.status || 'draft'} 
                  onValueChange={(value) => setSelectedQuote({ ...selectedQuote, status: value as QuoteStatus } as Quote)}
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
                <Label htmlFor="include_vat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bill of Quantities (BOQ)</CardTitle>
            <CardDescription>Add items to the quote</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newQuoteItem.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={newQuoteItem.description}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={newQuoteItem.quantity}
                  onChange={handleQuantityChange}
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={newQuoteItem.unit}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Unit Price (KES)</Label>
                <Input
                  type="number"
                  id="unit_price"
                  name="unit_price"
                  value={newQuoteItem.unit_price}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex items-end mb-4">
              <Button type="button" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Separator />

            <Table>
              <TableCaption>A list of items in the quote.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quoteItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {editingItemId === item.id ? (
                        <Input
                          value={editingItem?.name || ''}
                          onChange={(e) => handleEditItemChange('name', e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          value={editingItem?.description || ''}
                          onChange={(e) => handleEditItemChange('description', e.target.value)}
                          className="w-full"
                        />
                      ) : (
                        item.description
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          value={editingItem?.quantity || 0}
                          onChange={(e) => handleEditItemChange('quantity', parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          value={editingItem?.unit || ''}
                          onChange={(e) => handleEditItemChange('unit', e.target.value)}
                          className="w-20"
                        />
                      ) : (
                        item.unit
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItemId === item.id ? (
                        <Input
                          type="number"
                          value={editingItem?.unit_price || 0}
                          onChange={(e) => handleEditItemChange('unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      ) : (
                        `KES ${item.unit_price.toLocaleString()}`
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      KES {(editingItemId === item.id && editingItem ? 
                        (editingItem.quantity * editingItem.unit_price).toLocaleString() : 
                        item.total.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        {editingItemId === item.id ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleStartEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5}>Subtotal</TableCell>
                  <TableCell className="text-right">KES {subtotal.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {includeVat && (
                  <TableRow>
                    <TableCell colSpan={5}>VAT ({vatRate}%)</TableCell>
                    <TableCell className="text-right">KES {tax.toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={5}>Total Amount {includeVat ? '(Incl. VAT)' : '(Excl. VAT)'}</TableCell>
                  <TableCell className="text-right font-bold">KES {totalAmount.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleSaveQuote({
            id: selectedQuote?.id,
            project_type: selectedQuote?.project_type,
            crop_type: selectedQuote?.crop_type,
            area_size: selectedQuote?.area_size,
            water_source: selectedQuote?.water_source,
            terrain_info: selectedQuote?.terrain_info,
            notes: selectedQuote?.notes,
            status: (selectedQuote?.status || 'draft') as QuoteStatus,
            valid_until: date?.to?.toISOString(),
            total_amount: totalAmount,
            include_vat: includeVat,
            vat_rate: vatRate,
          })}>
            Save Quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-blue-950/20 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="absolute top-12 right-16 w-2 h-2 bg-white rounded-full animate-pulse delay-100"></div>
            <div className="absolute bottom-8 left-12 w-2 h-2 bg-white rounded-full animate-pulse delay-200"></div>
            <div className="absolute bottom-16 right-8 w-4 h-4 bg-white rounded-full animate-pulse delay-300"></div>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-white border-opacity-30 shadow-lg">
                  📄
                </div>
                <div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Quote Management</h1>
                  <p className="text-blue-100 text-lg font-medium opacity-90">Create and manage professional quotes</p>
                  <div className="flex items-center gap-4 mt-3 text-blue-200">
                    <span className="text-sm">📊 Total Quotes: {quotes.length}</span>
                    <span className="text-sm">⚡ Active System</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleNewQuote}
                  className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white border-2 border-white border-opacity-30 hover:border-opacity-50 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Quote
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quote Cards Grid */}
        <div className="grid gap-8">
          {quotesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Loading quotes...</p>
              </div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No quotes yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first quote to get started</p>
              <Button onClick={handleNewQuote} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Quote
              </Button>
            </div>
          ) : (
            quotes.map((quote) => (
              <Card key={quote.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 dark:from-gray-800 dark:via-gray-700/50 dark:to-blue-900/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        {quote.quote_number.split('-')[1] || 'Q'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {quote.quote_number}
                          </CardTitle>
                          <Badge 
                            variant="secondary" 
                            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              quote.status === 'draft' 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
                                : quote.status === 'sent'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : quote.status === 'accepted'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : quote.status === 'rejected'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}
                          >
                            {quote.status}
                          </Badge>
                        </div>
                        
                        {/* Project Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {quote.project_type && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-blue-600 font-medium">🚿 Project:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{quote.project_type}</span>
                            </div>
                          )}
                          {quote.crop_type && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600 font-medium">🌱 Crop:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{quote.crop_type}</span>
                            </div>
                          )}
                          {quote.area_size && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-orange-600 font-medium">📏 Area:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{quote.area_size} acres</span>
                            </div>
                          )}
                          {quote.customer_id && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-purple-600 font-medium">👤 Customer:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium truncate">
                                {customers.find(c => c.id === quote.customer_id)?.company_name || 'Unknown'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Amount and VAT */}
                        {quote.total_amount && (
                          <div className="flex items-center gap-4 mb-4">
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
                              <span className="text-2xl font-black text-green-700 dark:text-green-400">
                                KES {quote.total_amount.toLocaleString()}
                              </span>
                            </div>
                            <Badge variant="outline" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-xs font-semibold">
                              {quote.include_vat ? `Incl. VAT (${quote.vat_rate || 16}%)` : 'Excl. VAT'}
                            </Badge>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <span className="opacity-70">📅</span>
                            <span>Created: {new Date(quote.created_at).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="opacity-70">⏰</span>
                            <span>Valid Until: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('en-GB') : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewPDF(quote)}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:border-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEditQuote(quote)}
                      className="bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:border-amber-300 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteQuote(quote.id)} 
                      disabled={deleteQuoteMutation.isPending}
                      className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:border-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800 dark:text-red-400 font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteQuoteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteManagement;
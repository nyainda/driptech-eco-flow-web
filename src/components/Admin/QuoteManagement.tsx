import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState(16);
  const [newQuoteItem, setNewQuoteItem] = useState<
    Omit<QuoteItem, "id" | "total">
  >({
    name: "",
    description: "",
    quantity: 1,
    unit: "unit",
    unit_price: 0,
  });
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)),
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("company_name", { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]).map((q) => ({
        ...q,
        include_vat: q.include_vat ?? true,
        vat_rate: q.vat_rate ?? 16,
        total_amount: q.total_amount ?? 0,
      })) as Quote[];
    },
  });

  const saveQuoteMutation = useMutation({
    mutationFn: async (quote: Partial<Quote>) => {
      if (quote.id) {
        const { data, error } = await supabase
          .from("quotes")
          .update({
            customer_id: quote.customer_id,
            project_type: quote.project_type,
            crop_type: quote.crop_type,
            area_size: quote.area_size,
            water_source: quote.water_source,
            terrain_info: quote.terrain_info,
            notes: quote.notes,
            status: quote.status || ("draft" as QuoteStatus),
            valid_until: quote.valid_until,
            total_amount: quote.total_amount,
            include_vat: quote.include_vat,
            vat_rate: quote.vat_rate,
          })
          .eq("id", quote.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("quotes")
          .insert({
            quote_number: `QT-${Date.now()}`,
            customer_id: quote.customer_id,
            project_type: quote.project_type,
            crop_type: quote.crop_type,
            area_size: quote.area_size,
            water_source: quote.water_source,
            terrain_info: quote.terrain_info,
            notes: quote.notes,
            status: (quote.status || "draft") as QuoteStatus,
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
      queryClient.invalidateQueries({ queryKey: ["quotes"] });

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
    },
  });

  const saveQuoteItemsMutation = useMutation({
    mutationFn: async ({
      quoteId,
      items,
    }: {
      quoteId: string;
      items: QuoteItem[];
    }) => {
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);

      if (deleteError) throw deleteError;

      const quoteItemsToInsert = items.map((item) => ({
        quote_id: quoteId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitprice: item.unit_price,
        total: item.total,
      }));

      const { data, error } = await supabase
        .from("quote_items")
        .insert(quoteItemsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
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
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
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
    },
  });

  const handleSaveQuote = (quote: Partial<Quote>) => {
    const validUntilDate =
      date?.to instanceof Date ? date.to.toISOString() : undefined;
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
    if (confirm("Are you sure you want to delete this quote?")) {
      deleteQuoteMutation.mutate(quoteId);
    }
  };

  const handleEditQuote = async (quote: Quote) => {
    setSelectedQuote(quote);

    setIncludeVat(quote.include_vat ?? true);
    setVatRate(quote.vat_rate ?? 16);

    setDate({
      from: new Date(quote.created_at),
      to: quote.valid_until ? new Date(quote.valid_until) : undefined,
    });

    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", quote.customer_id)
        .single();

      setSelectedCustomer(customer);
    }

    supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id)
      .then(({ data, error }) => {
        if (error) throw error;

        const mappedItems: QuoteItem[] = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitprice,
          total: item.total,
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
      name: "",
      description: "",
      quantity: 1,
      unit: "unit",
      unit_price: 0,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(quoteItems.filter((item) => item.id !== itemId));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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

      setQuoteItems(
        quoteItems.map((item) =>
          item.id === editingItem.id ? updatedItem : item,
        ),
      );

      setEditingItemId(null);
      setEditingItem(null);
    }
  };

  const handleEditItemChange = (
    field: keyof QuoteItem,
    value: string | number,
  ) => {
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
  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<Quote | null>(
    null,
  );
  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedCustomerForPDF, setSelectedCustomerForPDF] =
    useState<Customer | null>(null);

  const handleViewPDF = async (quote: Quote) => {
    setSelectedQuoteForPDF(quote);

    const { data: items, error: itemsError } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote.id);

    if (itemsError) {
      toast({
        title: "Error",
        description: "Failed to load quote items",
        variant: "destructive",
      });
      return;
    }

    const mappedItems: QuoteItem[] = (items || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitprice,
      total: item.total,
    }));

    setSelectedQuoteItems(mappedItems);

    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", quote.customer_id)
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
      <div className="space-y-6 bg-background p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowPDFPreview(false)}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            ← Back to Quotes
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Quote PDF Preview
          </h2>
        </div>

        <QuotePDF
          quote={{
            ...selectedQuoteForPDF,
            vat_rate: selectedQuoteForPDF.vat_rate ?? 16,
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
      <div className="space-y-4 sm:space-y-6 bg-background p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            className="border-border text-muted-foreground hover:bg-muted w-full sm:w-auto"
          >
            ← Back to Quotes
          </Button>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {selectedQuote ? "Edit Quote" : "New Quote"}
          </h2>
        </div>

        <Card className="bg-background border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">
              Customer Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Select or view customer details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground break-words">
                      {selectedCustomer.company_name}
                    </h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {selectedCustomer.contact_person} •{" "}
                      {selectedCustomer.email}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                      {selectedCustomer.phone} • {selectedCustomer.city},{" "}
                      {selectedCustomer.country}
                    </p>
                  </div>
                  <Dialog
                    open={showCustomerDialog}
                    onOpenChange={setShowCustomerDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-border text-muted-foreground hover:bg-muted w-full sm:w-auto"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Change Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-background border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">
                          Select Customer
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Choose a customer for this quote
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                        {customersLoading ? (
                          <div className="text-muted-foreground">
                            Loading customers...
                          </div>
                        ) : (
                          customers.map((customer) => (
                            <Card
                              key={customer.id}
                              className="cursor-pointer hover:bg-muted border-border"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground break-words">
                                      {customer.company_name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground break-words">
                                      {customer.contact_person} •{" "}
                                      {customer.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground break-words">
                                      {customer.city}, {customer.country}
                                    </p>
                                  </div>
                                  {selectedCustomer?.id === customer.id && (
                                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
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
              <Dialog
                open={showCustomerDialog}
                onOpenChange={setShowCustomerDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-border text-muted-foreground hover:bg-muted w-full sm:w-auto"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Select Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-background border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      Select Customer
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Choose a customer for this quote
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                    {customersLoading ? (
                      <div className="text-muted-foreground">
                        Loading customers...
                      </div>
                    ) : (
                      customers.map((customer) => (
                        <Card
                          key={customer.id}
                          className="cursor-pointer hover:bg-muted border-border"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <CardContent className="p-4">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground break-words">
                                {customer.company_name}
                              </h4>
                              <p className="text-sm text-muted-foreground break-words">
                                {customer.contact_person} • {customer.email}
                              </p>
                              <p className="text-sm text-muted-foreground break-words">
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

        <Card className="bg-background border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">Quote Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter the quote details below
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_type" className="text-foreground">
                  Project Type
                </Label>
                <Input
                  id="project_type"
                  defaultValue={selectedQuote?.project_type}
                  onChange={(e) =>
                    setSelectedQuote({
                      ...selectedQuote,
                      project_type: e.target.value,
                    } as Quote)
                  }
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="crop_type" className="text-foreground">
                  Crop Type
                </Label>
                <Input
                  id="crop_type"
                  defaultValue={selectedQuote?.crop_type}
                  onChange={(e) =>
                    setSelectedQuote({
                      ...selectedQuote,
                      crop_type: e.target.value,
                    } as Quote)
                  }
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="area_size" className="text-foreground">
                  Area Size (acres)
                </Label>
                <Input
                  type="number"
                  id="area_size"
                  defaultValue={selectedQuote?.area_size}
                  onChange={(e) =>
                    setSelectedQuote({
                      ...selectedQuote,
                      area_size: parseFloat(e.target.value),
                    } as Quote)
                  }
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="water_source" className="text-foreground">
                  Water Source
                </Label>
                <Input
                  id="water_source"
                  defaultValue={selectedQuote?.water_source}
                  onChange={(e) =>
                    setSelectedQuote({
                      ...selectedQuote,
                      water_source: e.target.value,
                    } as Quote)
                  }
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="terrain_info" className="text-foreground">
                Terrain Info
              </Label>
              <Textarea
                id="terrain_info"
                defaultValue={selectedQuote?.terrain_info}
                onChange={(e) =>
                  setSelectedQuote({
                    ...selectedQuote,
                    terrain_info: e.target.value,
                  } as Quote)
                }
                className="bg-background border-border text-foreground placeholder-muted-foreground"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-foreground">
                Notes
              </Label>
              <Textarea
                id="notes"
                defaultValue={selectedQuote?.notes}
                onChange={(e) =>
                  setSelectedQuote({
                    ...selectedQuote,
                    notes: e.target.value,
                  } as Quote)
                }
                className="bg-background border-border text-foreground placeholder-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Valid Until</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal border-border text-foreground hover:bg-muted",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {date?.from ? (
                          date.to ? (
                            `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
                          ) : (
                            format(date.from, "PPP")
                          )
                        ) : (
                          "Pick a date"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-background border-border"
                    align="start"
                  >
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
                <Label htmlFor="status" className="text-foreground">
                  Status
                </Label>
                <Select
                  value={selectedQuote?.status || "draft"}
                  onValueChange={(value) =>
                    setSelectedQuote({
                      ...selectedQuote,
                      status: value as QuoteStatus,
                    } as Quote)
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_vat"
                  checked={includeVat}
                  onCheckedChange={(checked) =>
                    setIncludeVat(checked as boolean)
                  }
                />
                <Label
                  htmlFor="include_vat"
                  className="text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Include VAT
                </Label>
              </div>
              {includeVat && (
                <div>
                  <Label htmlFor="vat_rate" className="text-foreground">
                    VAT Rate (%)
                  </Label>
                  <Input
                    type="number"
                    id="vat_rate"
                    value={vatRate}
                    onChange={(e) =>
                      setVatRate(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    className="bg-background border-border text-foreground placeholder-muted-foreground"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border shadow-lg overflow-hidden">
          <CardHeader>
            <CardTitle className="text-foreground">
              Bill of Quantities (BOQ)
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Add items to the quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Item Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newQuoteItem.name}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-foreground">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={newQuoteItem.description}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="quantity" className="text-foreground">
                  Quantity
                </Label>
                <Input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={newQuoteItem.quantity}
                  onChange={handleQuantityChange}
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-foreground">
                  Unit
                </Label>
                <Input
                  id="unit"
                  name="unit"
                  value={newQuoteItem.unit}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
              <div>
                <Label htmlFor="unit_price" className="text-foreground">
                  Unit Price (KES)
                </Label>
                <Input
                  type="number"
                  id="unit_price"
                  name="unit_price"
                  value={newQuoteItem.unit_price}
                  onChange={handleInputChange}
                  className="bg-background border-border text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-end mb-4">
              <Button
                type="button"
                onClick={handleAddItem}
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Separator className="bg-border" />

            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableCaption className="text-muted-foreground">
                    A list of items in the quote.
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground min-w-[120px]">Item</TableHead>
                      <TableHead className="text-foreground min-w-[150px]">Description</TableHead>
                      <TableHead className="text-foreground min-w-[80px]">Quantity</TableHead>
                      <TableHead className="text-foreground min-w-[80px]">Unit</TableHead>
                      <TableHead className="text-foreground min-w-[100px]">Unit Price</TableHead>
                      <TableHead className="text-right text-foreground min-w-[100px]">
                        Total
                      </TableHead>
                      <TableHead className="text-right text-foreground min-w-[120px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-foreground">
                          {editingItemId === item.id ? (
                            <Input
                              value={editingItem?.name || ""}
                              onChange={(e) =>
                                handleEditItemChange("name", e.target.value)
                              }
                              className="w-full bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          ) : (
                            <span className="break-words">{item.name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {editingItemId === item.id ? (
                            <Input
                              value={editingItem?.description || ""}
                              onChange={(e) =>
                                handleEditItemChange("description", e.target.value)
                              }
                              className="w-full bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          ) : (
                            <span className="break-words">{item.description}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {editingItemId === item.id ? (
                            <Input
                              type="number"
                              value={editingItem?.quantity || 0}
                              onChange={(e) =>
                                handleEditItemChange(
                                  "quantity",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-20 bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {editingItemId === item.id ? (
                            <Input
                              value={editingItem?.unit || ""}
                              onChange={(e) =>
                                handleEditItemChange("unit", e.target.value)
                              }
                              className="w-20 bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          ) : (
                            item.unit
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {editingItemId === item.id ? (
                            <Input
                              type="number"
                              value={editingItem?.unit_price || 0}
                              onChange={(e) =>
                                handleEditItemChange(
                                  "unit_price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-24 bg-background border-border text-foreground placeholder-muted-foreground"
                            />
                          ) : (
                            `KES ${item.unit_price.toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          KES{" "}
                          {editingItemId === item.id && editingItem
                            ? (
                                editingItem.quantity * editingItem.unit_price
                              ).toLocaleString()
                            : item.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingItemId === item.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="hover:bg-muted"
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="hover:bg-muted"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(item)}
                                  className="hover:bg-muted"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="hover:bg-muted"
                                >
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
                      <TableCell colSpan={5} className="text-foreground">
                        Subtotal
                      </TableCell>
                      <TableCell className="text-right text-foreground">
                        KES {subtotal.toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {includeVat && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-foreground">
                          VAT ({vatRate}%)
                        </TableCell>
                        <TableCell className="text-right text-foreground">
                          KES {tax.toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={5} className="text-foreground">
                        Total Amount {includeVat ? "(Incl. VAT)" : "(Excl. VAT)"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        KES {totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowForm(false)}
            className="border-border text-muted-foreground hover:bg-muted w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              handleSaveQuote({
                id: selectedQuote?.id,
                project_type: selectedQuote?.project_type,
                crop_type: selectedQuote?.crop_type,
                area_size: selectedQuote?.area_size,
                water_source: selectedQuote?.water_source,
                terrain_info: selectedQuote?.terrain_info,
                notes: selectedQuote?.notes,
                status: (selectedQuote?.status || "draft") as QuoteStatus,
                valid_until: date?.to?.toISOString(),
                total_amount: totalAmount,
                include_vat: includeVat,
                vat_rate: vatRate,
              })
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            Save Quote
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="bg-background border-border shadow-lg">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="p-2 rounded-xl bg-muted border border-border w-fit">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    Quote Management
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create and manage professional quotes
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                    <span className="text-sm">
                      Total Quotes: {quotes.length}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleNewQuote}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 transform hover:scale-105 w-full lg:w-auto"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create New Quote
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:gap-6 lg:gap-8">
          {quotesLoading ? (
            <Card className="bg-background border-border shadow-lg">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground text-lg font-medium">
                    Loading quotes...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : quotes.length === 0 ? (
            <Card className="bg-background border-border shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No quotes yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first quote to get started
                </p>
                <Button
                  onClick={handleNewQuote}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Quote
                </Button>
              </CardContent>
            </Card>
          ) : (
            quotes.map((quote) => (
              <Card
                key={quote.id}
                className="group bg-background border-border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted border border-border rounded-xl flex items-center justify-center text-foreground font-bold text-base sm:text-xl flex-shrink-0">
                        {quote.quote_number.split("-")[1]?.slice(-4) || "Q"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground break-all">
                            {quote.quote_number}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="px-3 py-1 text-xs font-semibold uppercase tracking-wide bg-muted text-muted-foreground border-border w-fit"
                          >
                            {quote.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                          {quote.project_type && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-medium flex-shrink-0">
                                🚿
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-primary font-medium">Project: </span>
                                <span className="text-foreground break-words">
                                  {quote.project_type}
                                </span>
                              </div>
                            </div>
                          )}
                          {quote.crop_type && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-medium flex-shrink-0">
                                🌱
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-primary font-medium">Crop: </span>
                                <span className="text-foreground break-words">
                                  {quote.crop_type}
                                </span>
                              </div>
                            </div>
                          )}
                          {quote.area_size && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-medium flex-shrink-0">
                                📏
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-primary font-medium">Area: </span>
                                <span className="text-foreground">
                                  {quote.area_size} acres
                                </span>
                              </div>
                            </div>
                          )}
                          {quote.customer_id && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-medium flex-shrink-0">
                                👤
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-primary font-medium">Customer: </span>
                                <span className="text-foreground truncate">
                                  {customers.find(
                                    (c) => c.id === quote.customer_id,
                                  )?.company_name || "Unknown"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {quote.total_amount && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                            <div className="bg-muted border border-border px-4 py-2 rounded-lg w-fit">
                              <span className="text-xl sm:text-2xl font-bold text-foreground break-all">
                                KES {quote.total_amount.toLocaleString()}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-background border-border text-xs text-muted-foreground font-semibold w-fit"
                            >
                              {quote.include_vat
                                ? `Incl. VAT (${quote.vat_rate || 16}%)`
                                : "Excl. VAT"}
                            </Badge>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0">📅</span>
                            <span className="break-words">
                              Created:{" "}
                              {new Date(quote.created_at).toLocaleDateString(
                                "en-GB",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0">⏰</span>
                            <span className="break-words">
                              Valid Until:{" "}
                              {quote.valid_until
                                ? new Date(
                                    quote.valid_until,
                                  ).toLocaleDateString("en-GB")
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2 sm:gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPDF(quote)}
                      className="bg-background border-border text-muted-foreground hover:bg-muted font-semibold w-full sm:w-auto"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditQuote(quote)}
                      className="bg-background border-border text-muted-foreground hover:bg-muted font-semibold w-full sm:w-auto"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuote(quote.id)}
                      disabled={deleteQuoteMutation.isPending}
                      className="bg-background border-border text-muted-foreground hover:bg-muted font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleteQuoteMutation.isPending ? "Deleting..." : "Delete"}
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
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { User, Check } from "lucide-react";
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
import BOQSectionBuilder, { type BOQSection, type CatalogueProduct } from "./Quote/BOQSectionBuilder";
import QuoteDashboard from "./Quote/QuoteDashboard";

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
  product_id?: string | null;
  section_id?: string | null;
  section_name?: string;
}

const QuoteManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteSections, setQuoteSections] = useState<BOQSection[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);
  const [vatRate, setVatRate] = useState(16);
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

  const { data: quoteProducts = [], isLoading: quoteProductsLoading } = useQuery({
    queryKey: ["quote-products-for-quotes"],
    enabled: showForm,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const allProducts: CatalogueProduct[] = [];
      const pageSize = 500;

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, model_number, category, subcategory, description, price, in_stock")
          .order("name", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        allProducts.push(...((data || []) as CatalogueProduct[]));
        if (!data || data.length < pageSize) break;
      }

      return allProducts;
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
        sections: quoteSections,
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
      sections,
      items,
    }: {
      quoteId: string;
      sections: BOQSection[];
      items: QuoteItem[];
    }) => {
      const sectionRows = sections.map((section, index) => ({
        id: section.id,
        quote_id: quoteId,
        name: section.name.trim() || `Section ${index + 1}`,
        description: section.description?.trim() || null,
        sort_order: index,
      }));

      const { error: sectionSaveError } = await supabase
        .from("quote_sections")
        .upsert(sectionRows, { onConflict: "id" });
      if (sectionSaveError) throw sectionSaveError;

      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);
      if (deleteError) throw deleteError;

      if (items.length > 0) {
        const sectionOrder = new Map(
          sectionRows.map((section) => [section.id, section.sort_order]),
        );
        const orderedItems = items
          .map((item, index) => ({ item, index }))
          .sort((left, right) => {
            const leftSection = left.item.section_id || sectionRows[0]?.id || "";
            const rightSection = right.item.section_id || sectionRows[0]?.id || "";
            return (
              (sectionOrder.get(leftSection) ?? 0) -
                (sectionOrder.get(rightSection) ?? 0) ||
              left.index - right.index
            );
          })
          .map(({ item }) => item);

        const quoteItemsToInsert = orderedItems.map((item, index) => ({
          quote_id: quoteId,
          section_id: item.section_id || sectionRows[0]?.id || null,
          product_id: item.product_id || null,
          sort_order: index,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit || "unit",
          unitprice: item.unit_price,
          total: item.total,
        }));

        const { error } = await supabase
          .from("quote_items")
          .insert(quoteItemsToInsert);
        if (error) throw error;
      }

      const { data: savedSections, error: savedSectionsError } = await supabase
        .from("quote_sections")
        .select("id")
        .eq("quote_id", quoteId);
      if (savedSectionsError) throw savedSectionsError;

      const retainedIds = new Set(sectionRows.map((section) => section.id));
      for (const section of savedSections || []) {
        if (!retainedIds.has(section.id)) {
          const { error } = await supabase
            .from("quote_sections")
            .delete()
            .eq("id", section.id);
          if (error) throw error;
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      setShowForm(false);
      setSelectedQuote(null);
      setQuoteItems([]);
      setQuoteSections([]);
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
    if (quoteSections.length === 0 || quoteSections.some((section) => !section.name.trim())) {
      toast({
        title: "Check BOQ sections",
        description: "Every BOQ section needs a name before the quotation can be saved.",
        variant: "destructive",
      });
      return;
    }

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

    setSelectedCustomer(null);
    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", quote.customer_id)
        .single();

      setSelectedCustomer(customer);
    }

    try {
      const [{ data: sectionRows, error: sectionsError }, { data: itemRows, error: itemsError }] =
        await Promise.all([
          supabase
            .from("quote_sections")
            .select("*")
            .eq("quote_id", quote.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("quote_items")
            .select("*")
            .eq("quote_id", quote.id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
        ]);

      if (sectionsError) throw sectionsError;
      if (itemsError) throw itemsError;

      const loadedSections: BOQSection[] =
        (sectionRows || []).map((section, index) => ({
          id: section.id,
          name: section.name,
          description: section.description || "",
          sort_order: section.sort_order ?? index,
        }));
      const sectionsForQuote =
        loadedSections.length > 0
          ? loadedSections
          : [{ id: crypto.randomUUID(), name: "General", description: "", sort_order: 0 }];
      const sectionNames = new Map(
        sectionsForQuote.map((section) => [section.id, section.name]),
      );
      const defaultSection = sectionsForQuote[0];

      const mappedItems: QuoteItem[] = (itemRows || []).map((item, index) => {
        const sectionId = item.section_id || defaultSection.id;
        return {
          id: item.id,
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitprice,
          total: item.total,
          product_id: item.product_id || null,
          section_id: sectionId,
          section_name: sectionNames.get(sectionId) || defaultSection.name,
          sort_order: item.sort_order ?? index,
        };
      });

      setQuoteSections(sectionsForQuote);
      setQuoteItems(mappedItems);
      setShowForm(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load quotation BOQ",
        variant: "destructive",
      });
    }
  };

  const handleNewQuote = () => {
    setSelectedQuote(null);
    setQuoteItems([]);
    setQuoteSections([
      { id: crypto.randomUUID(), name: "General", description: "", sort_order: 0 },
    ]);
    setSelectedCustomer(null);
    setIncludeVat(true);
    setVatRate(16);
    setShowForm(true);
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
  const [selectedQuoteSections, setSelectedQuoteSections] = useState<BOQSection[]>([]);
  const [selectedCustomerForPDF, setSelectedCustomerForPDF] =
    useState<Customer | null>(null);

  const handleViewPDF = async (quote: Quote) => {
    setSelectedQuoteForPDF(quote);

    const [{ data: items, error: itemsError }, { data: sections, error: sectionsError }] =
      await Promise.all([
        supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("quote_sections")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true }),
      ]);

    if (itemsError || sectionsError) {
      toast({
        title: "Error",
        description: "Failed to load quotation details",
        variant: "destructive",
      });
      return;
    }

    const loadedSections: BOQSection[] = (sections || []).map((section, index) => ({
      id: section.id,
      name: section.name,
      description: section.description || "",
      sort_order: section.sort_order ?? index,
    }));
    const sectionNames = new Map(
      loadedSections.map((section) => [section.id, section.name]),
    );

    const mappedItems: QuoteItem[] = (items || []).map((item, index) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitprice,
      total: item.total,
      product_id: item.product_id || null,
      section_id: item.section_id || null,
      section_name: item.section_id
        ? sectionNames.get(item.section_id) || "General"
        : "General",
      sort_order: item.sort_order ?? index,
    }));

    setSelectedQuoteSections(loadedSections);
    setSelectedQuoteItems(mappedItems);

    if (quote.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("*")
        .eq("id", quote.customer_id)
        .single();
      setSelectedCustomerForPDF(customer);
    } else {
      setSelectedCustomerForPDF(null);
    }

    setShowPDFPreview(true);
  };

  const handleEditFromPDF = () => {
    if (selectedQuoteForPDF) {
      setSelectedQuote(selectedQuoteForPDF);
      const previewSections =
        selectedQuoteSections.length > 0
          ? selectedQuoteSections
          : [{ id: crypto.randomUUID(), name: "General", description: "", sort_order: 0 }];
      const fallbackSectionId = previewSections[0].id;
      setQuoteSections(previewSections);
      setQuoteItems(
        selectedQuoteItems.map((item) => ({
          ...item,
          section_id: item.section_id || fallbackSectionId,
          section_name: item.section_name || previewSections[0].name,
        })),
      );
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

        <BOQSectionBuilder
          sections={quoteSections}
          items={quoteItems}
          products={quoteProducts}
          productsLoading={quoteProductsLoading}
          onSectionsChange={setQuoteSections}
          onItemsChange={setQuoteItems}
        />

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
    <QuoteDashboard
      quotes={quotes}
      customers={customers}
      isLoading={quotesLoading}
      onCreateQuote={handleNewQuote}
      onViewQuote={handleViewPDF}
      onEditQuote={handleEditQuote}
      onDeleteQuote={handleDeleteQuote}
    />
  );
};

export default QuoteManagement;
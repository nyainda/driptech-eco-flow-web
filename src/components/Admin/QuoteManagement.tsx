import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
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
import {
  User,
  Check,
  ArrowLeft,
  Building2,
  CalendarIcon,
  Save,
  Sparkles,
  Wallet,
  Search,
  Layers,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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
import BOQSectionBuilder, {
  type BOQSection,
  type CatalogueProduct,
} from "./Quote/BOQSectionBuilder";
import QuoteDashboard, { type QuoteStatus } from "./Quote/QuoteDashboard";
import { COMPANY, numberToWordsKES } from "./shared/companyBrand";

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
  sort_order?: number;
}

const PROJECT_TYPE_PRESETS = [
  "Commercial Drip Irrigation System",
  "Overhead Sprinkler Irrigation System",
  "Solar Pumping & Borehole Reticulation",
  "Greenhouse Drip & Fertigation System",
  "Dam Liner & Water Storage System",
  "Automated Pop-Up Lawn & Landscape System",
];

const WATER_SOURCE_PRESETS = [
  "Borehole + Elevated Tank",
  "River / Surface Water Pump",
  "Earth Dam / Lined Pan",
  "Municipal / County Water Supply",
  "Rainwater Harvesting Tank",
];

const formatKES = (val: number) =>
  "KES " +
  Number(val || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const [customerSearch, setCustomerSearch] = useState("");

  // Controlled form state for Quote metadata
  const [projectType, setProjectType] = useState("");
  const [cropType, setCropType] = useState("");
  const [areaSize, setAreaSize] = useState<string>("");
  const [waterSource, setWaterSource] = useState("");
  const [terrainInfo, setTerrainInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>("draft");
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

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.company_name, c.contact_person, c.email, c.phone, c.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [customers, customerSearch]);

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

  const { data: quoteProducts = [], isLoading: quoteProductsLoading } =
    useQuery({
      queryKey: ["quote-products-for-quotes"],
      enabled: showForm,
      staleTime: 5 * 60 * 1000,
      queryFn: async () => {
        const allProducts: CatalogueProduct[] = [];
        const pageSize = 500;

        for (let from = 0; ; from += pageSize) {
          const { data, error } = await supabase
            .from("products")
            .select(
              "id, name, model_number, category, subcategory, description, price, in_stock",
            )
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
        const yearMonth = `${new Date().getFullYear()}${String(
          new Date().getMonth() + 1,
        ).padStart(2, "0")}`;
        const rand = String(Math.floor(Math.random() * 9000) + 1000);
        const { data, error } = await supabase
          .from("quotes")
          .insert({
            quote_number: `DT-BOQ-${yearMonth}-${rand}`,
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
            const leftSection =
              left.item.section_id || sectionRows[0]?.id || "";
            const rightSection =
              right.item.section_id || sectionRows[0]?.id || "";
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
        title: "Proposal Saved",
        description: "Engineering Quotation & BOQ saved successfully.",
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
        title: "Deleted",
        description: "Quotation removed from register.",
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

  const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const tax = includeVat ? subtotal * (vatRate / 100) : 0;
  const totalAmount = subtotal + tax;

  const handleSaveQuote = () => {
    if (
      quoteSections.length === 0 ||
      quoteSections.some((section) => !section.name.trim())
    ) {
      toast({
        title: "Check BOQ sections",
        description:
          "Every BOQ section needs a name before the quotation can be saved.",
        variant: "destructive",
      });
      return;
    }

    const validUntilDate =
      date?.to instanceof Date ? date.to.toISOString() : undefined;
    saveQuoteMutation.mutate({
      id: selectedQuote?.id,
      project_type: projectType.trim() || undefined,
      crop_type: cropType.trim() || undefined,
      area_size: areaSize ? parseFloat(areaSize) : undefined,
      water_source: waterSource.trim() || undefined,
      terrain_info: terrainInfo.trim() || undefined,
      notes: notes.trim() || undefined,
      status: quoteStatus,
      valid_until: validUntilDate,
      customer_id: selectedCustomer?.id,
      total_amount: totalAmount,
      include_vat: includeVat,
      vat_rate: vatRate,
    });
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      deleteQuoteMutation.mutate(quoteId);
    }
  };

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Status Updated",
        description: `Quotation status updated to ${status.toUpperCase()}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateQuote = async (quote: Quote) => {
    try {
      const [{ data: sectionRows }, { data: itemRows }] = await Promise.all([
        supabase
          .from("quote_sections")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true }),
      ]);

      setSelectedQuote(null);
      setProjectType(quote.project_type ? `${quote.project_type} (Copy)` : "");
      setCropType(quote.crop_type || "");
      setAreaSize(quote.area_size ? String(quote.area_size) : "");
      setWaterSource(quote.water_source || "");
      setTerrainInfo(quote.terrain_info || "");
      setNotes(quote.notes || COMPANY.defaultQuoteTerms);
      setQuoteStatus("draft");
      setIncludeVat(quote.include_vat ?? true);
      setVatRate(quote.vat_rate ?? 16);
      setDate({
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 30)),
      });

      if (quote.customer_id) {
        const cust = customers.find((c) => c.id === quote.customer_id) || null;
        setSelectedCustomer(cust);
      } else {
        setSelectedCustomer(null);
      }

      const idMap = new Map<string, string>();
      const clonedSections: BOQSection[] =
        sectionRows && sectionRows.length > 0
          ? sectionRows.map((s, idx) => {
              const newId = crypto.randomUUID();
              idMap.set(s.id, newId);
              return {
                id: newId,
                name: s.name,
                description: s.description || "",
                sort_order: idx,
              };
            })
          : [
              {
                id: crypto.randomUUID(),
                name: "Headworks & Filtration Unit",
                description: "",
                sort_order: 0,
              },
            ];

      const defaultSecId = clonedSections[0].id;
      const clonedItems: QuoteItem[] = (itemRows || []).map((item, idx) => {
        const newSecId =
          (item.section_id && idMap.get(item.section_id)) || defaultSecId;
        const secObj =
          clonedSections.find((s) => s.id === newSecId) || clonedSections[0];
        return {
          id: crypto.randomUUID(),
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          unit: item.unit || "unit",
          unit_price: item.unitprice,
          total: item.total,
          product_id: item.product_id || null,
          section_id: newSecId,
          section_name: secObj.name,
          sort_order: idx,
        };
      });

      setQuoteSections(clonedSections);
      setQuoteItems(clonedItems);
      setShowForm(true);
      toast({
        title: "BOQ Cloned into Editor",
        description: `Review and save the duplicated BOQ from ${quote.quote_number}.`,
      });
    } catch (error: any) {
      toast({
        title: "Clone Failed",
        description: error?.message || "Could not clone quotation",
        variant: "destructive",
      });
    }
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    if (!quote.customer_id) {
      toast({
        title: "Customer Required",
        description:
          "Please link a customer to this quotation before converting it into an invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const [{ data: sectionRows }, { data: itemRows }] = await Promise.all([
        supabase
          .from("quote_sections")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true }),
        supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", quote.id)
          .order("sort_order", { ascending: true }),
      ]);

      const secMap = new Map(
        (sectionRows || []).map((s) => [s.id, s.name as string]),
      );

      const itemsSubtotal = (itemRows || []).reduce(
        (sum, item) => sum + Number(item.total || 0),
        0,
      );
      const rate = quote.include_vat ? Number(quote.vat_rate ?? 16) : 0;
      const vatAmt = (itemsSubtotal * rate) / 100;
      const grandTotal = itemsSubtotal + vatAmt;

      const issueDate = new Date().toISOString().slice(0, 10);
      const dueDate = new Date(Date.now() + 30 * 86400000)
        .toISOString()
        .slice(0, 10);
      const invNumber = `INV-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1,
      ).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const { data: createdInvoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invNumber,
          customer_id: quote.customer_id,
          quote_id: quote.id,
          status: "draft",
          issue_date: issueDate,
          due_date: dueDate,
          payment_terms: "30 days",
          subtotal: itemsSubtotal,
          tax_rate: rate,
          tax_amount: vatAmt,
          discount_amount: 0,
          total_amount: grandTotal,
          payment_details: COMPANY.defaultPaymentDetails,
          terms_and_conditions: COMPANY.defaultInvoiceTerms,
          notes: `Converted from Approved Quotation ${quote.quote_number}${quote.project_type ? ` (${quote.project_type})` : ""}`,
        })
        .select()
        .single();

      if (invError) throw invError;

      if (itemRows && itemRows.length > 0) {
        const invoiceItemsPayload = itemRows.map((item, idx) => ({
          invoice_id: createdInvoice.id,
          name: item.name,
          description: item.description || null,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "pcs",
          unit_price: Number(item.unitprice) || 0,
          total: Number(item.total) || 0,
          project_name:
            (item.section_id && secMap.get(item.section_id)) ||
            quote.project_type ||
            "Irrigation Works",
          project_subtitle: quote.crop_type
            ? `${quote.crop_type}${quote.area_size ? ` · ${quote.area_size} Acres` : ""}`
            : null,
          sort_order: idx,
        }));

        const { error: itemsErr } = await supabase
          .from("invoice_items")
          .insert(invoiceItemsPayload);
        if (itemsErr) throw itemsErr;
      }

      toast({
        title: "Invoice Generated",
        description: `Created Invoice ${invNumber} from ${quote.quote_number}. Open Invoices & Receipts to issue or print it.`,
      });
    } catch (error: any) {
      toast({
        title: "Conversion Failed",
        description: error?.message || "Could not convert quotation to invoice",
        variant: "destructive",
      });
    }
  };

  const handleEditQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    setProjectType(quote.project_type || "");
    setCropType(quote.crop_type || "");
    setAreaSize(quote.area_size ? String(quote.area_size) : "");
    setWaterSource(quote.water_source || "");
    setTerrainInfo(quote.terrain_info || "");
    setNotes(quote.notes || "");
    setQuoteStatus(quote.status || "draft");
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
      const [
        { data: sectionRows, error: sectionsError },
        { data: itemRows, error: itemsError },
      ] = await Promise.all([
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

      const loadedSections: BOQSection[] = (sectionRows || []).map(
        (section, index) => ({
          id: section.id,
          name: section.name,
          description: section.description || "",
          sort_order: section.sort_order ?? index,
        }),
      );
      const sectionsForQuote =
        loadedSections.length > 0
          ? loadedSections
          : [
              {
                id: crypto.randomUUID(),
                name: "Headworks & Filtration Unit",
                description: "",
                sort_order: 0,
              },
            ];
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
        description:
          error instanceof Error
            ? error.message
            : "Failed to load quotation BOQ",
        variant: "destructive",
      });
    }
  };

  const handleNewQuote = () => {
    setSelectedQuote(null);
    setProjectType("Commercial Drip Irrigation System");
    setCropType("");
    setAreaSize("1");
    setWaterSource("Borehole + Elevated Tank");
    setTerrainInfo("");
    setNotes(COMPANY.defaultQuoteTerms);
    setQuoteStatus("draft");
    setQuoteItems([]);
    setQuoteSections([
      {
        id: crypto.randomUUID(),
        name: "Headworks & Filtration Unit",
        description:
          "Primary filtration, pressure regulation, and fertigation manifold",
        sort_order: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "Mainline & Sub-Main Pipework",
        description: "HDPE/PVC supply lines, control valves, and compression fittings",
        sort_order: 1,
      },
      {
        id: crypto.randomUUID(),
        name: "In-Field Drip Laterals & Fittings",
        description: "Dripline rolls, start connectors, offtakes, and end closures",
        sort_order: 2,
      },
    ]);
    setSelectedCustomer(null);
    setIncludeVat(true);
    setVatRate(16);
    setDate({
      from: new Date(),
      to: new Date(new Date().setDate(new Date().getDate() + 30)),
    });
    setShowForm(true);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDialog(false);
    toast({
      title: "Client Linked",
      description: `${customer.company_name || customer.contact_person} linked to this proposal.`,
    });
  };

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<Quote | null>(
    null,
  );
  const [selectedQuoteItems, setSelectedQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedQuoteSections, setSelectedQuoteSections] = useState<
    BOQSection[]
  >([]);
  const [selectedCustomerForPDF, setSelectedCustomerForPDF] =
    useState<Customer | null>(null);

  const handleViewPDF = async (quote: Quote) => {
    setSelectedQuoteForPDF(quote);

    const [
      { data: items, error: itemsError },
      { data: sections, error: sectionsError },
    ] = await Promise.all([
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

    const loadedSections: BOQSection[] = (sections || []).map(
      (section, index) => ({
        id: section.id,
        name: section.name,
        description: section.description || "",
        sort_order: section.sort_order ?? index,
      }),
    );
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
      setProjectType(selectedQuoteForPDF.project_type || "");
      setCropType(selectedQuoteForPDF.crop_type || "");
      setAreaSize(
        selectedQuoteForPDF.area_size
          ? String(selectedQuoteForPDF.area_size)
          : "",
      );
      setWaterSource(selectedQuoteForPDF.water_source || "");
      setTerrainInfo(selectedQuoteForPDF.terrain_info || "");
      setNotes(selectedQuoteForPDF.notes || "");
      setQuoteStatus(selectedQuoteForPDF.status || "draft");
      setIncludeVat(selectedQuoteForPDF.include_vat ?? true);
      setVatRate(selectedQuoteForPDF.vat_rate ?? 16);

      const previewSections =
        selectedQuoteSections.length > 0
          ? selectedQuoteSections
          : [
              {
                id: crypto.randomUUID(),
                name: "General",
                description: "",
                sort_order: 0,
              },
            ];
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
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPDFPreview(false)}
              className="shrink-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quotation Register
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Commercial Desk / Document Preview
              </p>
              <h2 className="mt-0.5 truncate text-lg font-bold text-foreground">
                {selectedQuoteForPDF.quote_number}
              </h2>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleConvertToInvoice(selectedQuoteForPDF)}
            className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
          >
            Convert to Invoice
          </Button>
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
      <div className="space-y-6">
        {/* Top Editor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {selectedQuote ? selectedQuote.quote_number : "New BOQ"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Engineering Quotation &amp; Bill of Quantities
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground mt-0.5">
                {selectedQuote
                  ? `Edit Proposal ${selectedQuote.quote_number}`
                  : "Create Engineering Quotation & BOQ"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuote}
              disabled={saveQuoteMutation.isPending}
              className="gap-2 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {saveQuoteMutation.isPending
                ? "Saving BOQ…"
                : "Save Proposal & BOQ"}
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6 min-w-0">
            {/* Step 1: Client Selection */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      Step 01 · Client &amp; Off-Taker
                    </p>
                    <CardTitle className="text-base mt-0.5">
                      Client Organization / Farm Owner
                    </CardTitle>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {selectedCustomer ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">
                          {selectedCustomer.company_name ||
                            selectedCustomer.contact_person}
                        </h3>
                        <Badge variant="secondary" className="text-[10px]">
                          Linked Client
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Attn: {selectedCustomer.contact_person} ·{" "}
                        {selectedCustomer.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone} ·{" "}
                        {[selectedCustomer.city, selectedCustomer.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerDialog(true)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Change Client
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-dashed border-border p-4 bg-muted/20">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        No client linked yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select a registered client from your CRM directory to
                        populate the proposal masthead.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowCustomerDialog(true)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Select Client
                    </Button>
                  </div>
                )}

                <Dialog
                  open={showCustomerDialog}
                  onOpenChange={setShowCustomerDialog}
                >
                  <DialogContent className="max-w-2xl bg-background border-border">
                    <DialogHeader>
                      <DialogTitle>Select Client Organization</DialogTitle>
                      <DialogDescription>
                        Search and link a customer profile to this quotation.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="relative my-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by company, contact person, email, or city…"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="grid gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                      {customersLoading ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">
                          Loading customers...
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-8 text-center">
                          No matching customers found.
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all"
                          >
                            <div className="min-w-0">
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {customer.company_name ||
                                  customer.contact_person}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {customer.contact_person} · {customer.email} ·{" "}
                                {customer.phone}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {[customer.city, customer.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                            {selectedCustomer?.id === customer.id && (
                              <Check className="h-5 w-5 text-primary shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Step 2: Agronomic & Engineering Site Parameters */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Step 02 · Engineering &amp; Agronomic Parameters
                </p>
                <CardTitle className="text-base mt-0.5">
                  Site Design Basis &amp; Validity
                </CardTitle>
                <CardDescription className="text-xs">
                  These technical parameters print in the Site Specification
                  Matrix on the A4 quotation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Quick Project Scope Presets
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROJECT_TYPE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProjectType(preset)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          projectType === preset
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="project_type">Project Scope / System</Label>
                    <Input
                      id="project_type"
                      value={projectType}
                      placeholder="e.g. Commercial Drip Irrigation System"
                      onChange={(e) => setProjectType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="crop_type">
                      Target Crop / Application
                    </Label>
                    <Input
                      id="crop_type"
                      value={cropType}
                      placeholder="e.g. Hass Avocado, Tomatoes, Onions, Horticulture"
                      onChange={(e) => setCropType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="area_size">Net Irrigated Area (Acres)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      id="area_size"
                      value={areaSize}
                      placeholder="e.g. 5"
                      onChange={(e) => setAreaSize(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="water_source">Water Source</Label>
                    <Input
                      id="water_source"
                      value={waterSource}
                      placeholder="e.g. Borehole + 10m Elevated Tank"
                      onChange={(e) => setWaterSource(e.target.value)}
                      list="water-source-presets"
                    />
                    <datalist id="water-source-presets">
                      {WATER_SOURCE_PRESETS.map((ws) => (
                        <option key={ws} value={ws} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="terrain_info">
                      Site / Terrain Profile
                    </Label>
                    <Input
                      id="terrain_info"
                      value={terrainInfo}
                      placeholder="e.g. Gentle 2% slope, red loam soil"
                      onChange={(e) => setTerrainInfo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Quotation Validity Window</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate text-xs">
                            {date?.from
                              ? date.to
                                ? `${format(date.from, "dd MMM yyyy")} - ${format(date.to, "dd MMM yyyy")}`
                                : format(date.from, "dd MMM yyyy")
                              : "Pick validity dates"}
                          </span>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="status">Proposal Status</Label>
                    <Select
                      value={quoteStatus}
                      onValueChange={(value) =>
                        setQuoteStatus(value as QuoteStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent to Client</SelectItem>
                        <SelectItem value="accepted">
                          Accepted / Approved
                        </SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Multi-Section BOQ Builder */}
            <BOQSectionBuilder
              sections={quoteSections}
              items={quoteItems}
              products={quoteProducts}
              productsLoading={quoteProductsLoading}
              onSectionsChange={setQuoteSections}
              onItemsChange={setQuoteItems}
            />

            {/* Step 4: Commercial Terms, Tax & Notes */}
            <Card className="border-border/80 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      Step 04 · Tax &amp; Commercial Terms
                    </p>
                    <CardTitle className="text-base mt-0.5">
                      VAT Configuration &amp; Proposal Terms
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNotes(COMPANY.defaultQuoteTerms)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Insert Standard Corporate Terms
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center space-x-2.5">
                    <Checkbox
                      id="include_vat"
                      checked={includeVat}
                      onCheckedChange={(checked) =>
                        setIncludeVat(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="include_vat"
                      className="text-sm font-semibold cursor-pointer"
                    >
                      Apply Value Added Tax (VAT)
                    </Label>
                  </div>
                  {includeVat && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="vat_rate" className="text-xs">
                        VAT Rate (%):
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
                        className="w-24 h-8"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">
                    Engineering Notes, Payment Schedule &amp; Warranty Terms
                  </Label>
                  <Textarea
                    id="notes"
                    rows={5}
                    value={notes}
                    placeholder="Enter payment schedule, warranty terms, and engineering assumptions..."
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Live Financial Summary Sidebar */}
          <aside className="space-y-4 xl:sticky xl:top-20">
            <div className="overflow-hidden rounded-2xl border border-emerald-900/30 bg-gradient-to-b from-[#0d281e] to-[#1b4332] p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
                  Live Proposal Valuation
                </span>
                <Wallet className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="mt-2 text-2xl font-black tracking-tight tabular-nums">
                {formatKES(totalAmount)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-200/90 italic leading-snug">
                {numberToWordsKES(totalAmount)}
              </p>

              <div className="mt-5 space-y-2.5 border-t border-white/15 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Work Packages</span>
                  <span className="font-bold">{quoteSections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">BOQ Line Items</span>
                  <span className="font-bold">{quoteItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Subtotal (Excl. VAT)</span>
                  <span className="font-mono font-semibold">
                    {formatKES(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">
                    {includeVat ? `VAT (${vatRate}%)` : "VAT"}
                  </span>
                  <span className="font-mono font-semibold">
                    {includeVat ? formatKES(tax) : "Exempt"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveQuote}
                disabled={saveQuoteMutation.isPending}
                className="mt-5 w-full bg-white text-[#12372a] hover:bg-emerald-50 font-bold"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveQuoteMutation.isPending ? "Saving…" : "Save Proposal & BOQ"}
              </Button>
            </div>

            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Section Breakdown
                </div>
                {quoteSections.map((sec, i) => {
                  const secSum = quoteItems
                    .filter((item) => item.section_id === sec.id)
                    .reduce((s, item) => s + item.total, 0);
                  return (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0 last:pb-0"
                    >
                      <span className="truncate text-muted-foreground">
                        {i + 1}. {sec.name || "Untitled"}
                      </span>
                      <span className="font-mono font-semibold text-foreground shrink-0">
                        {formatKES(secSum)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </aside>
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
      onStatusChange={handleStatusChange}
      onDuplicateQuote={handleDuplicateQuote}
      onConvertToInvoice={handleConvertToInvoice}
    />
  );
};

export default QuoteManagement;

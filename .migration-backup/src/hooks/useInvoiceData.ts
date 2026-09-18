// hooks/useInvoiceData.ts
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Invoice,
  Customer,
  Quote,
} from "@/components/Admin/types/InvoiceTypes";

export const useInvoiceData = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Load invoices from database
  const loadInvoices = async () => {
    try {
      setLoading(true);
      const { data: invoiceData, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          customer:customers(*),
          invoice_items(*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading invoices:", error);
        return;
      }

      // Type assertion to ensure compatibility
      setInvoices((invoiceData || []) as Invoice[]);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load customers for dropdown
  const loadCustomers = async () => {
    try {
      const { data: customerData, error } = await supabase
        .from("customers")
        .select("*")
        .order("company_name");

      if (error) {
        console.error("Error loading customers:", error);
        return;
      }

      setCustomers((customerData || []) as Customer[]);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  // Load quotes for invoice dropdown (all non-cancelled, with customer)
  const loadQuotes = async () => {
    try {
      const { data: quoteData, error } = await supabase
        .from("quotes")
        .select(
          `
          id,
          quote_number,
          total_amount,
          status,
          created_at,
          customer_id,
          notes,
          vat_rate,
          include_vat,
          customer:customers(id, company_name, contact_person)
        `,
        )
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading quotes:", error);
        // Fallback without join if relation name differs
        const { data: fallback, error: fbErr } = await supabase
          .from("quotes")
          .select("*")
          .order("created_at", { ascending: false });
        if (fbErr) {
          console.error("Error loading quotes (fallback):", fbErr);
          return;
        }
        setQuotes((fallback || []) as Quote[]);
        return;
      }

      setQuotes((quoteData || []) as Quote[]);
    } catch (error) {
      console.error("Error loading quotes:", error);
    }
  };

  return {
    invoices,
    customers,
    quotes,
    loading,
    loadInvoices,
    loadCustomers,
    loadQuotes,
  };
};

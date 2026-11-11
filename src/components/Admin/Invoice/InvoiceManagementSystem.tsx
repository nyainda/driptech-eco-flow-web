import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Loader2,
  Search,
  RefreshCw,
  FileText,
  Receipt,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "../types/InvoiceTypes";
import { useInvoiceData } from "@/hooks/useInvoiceData";
import {
  useInvoiceOperations,
  DocumentMode,
  getReceiptNumber,
} from "@/hooks/useInvoiceOperations";

import StatsCards from "./StatsCards";
import InvoicesTable from "./InvoicesTable";
import CreateInvoiceModal from "./CreateInvoiceModal";
import InvoiceModal from "./InvoiceModal";
import EditInvoiceModal from "./EditInvoiceModal";

type RegisterTab = "all" | "invoices" | "receipts";

const InvoiceManagementSystem = () => {
  const [registerTab, setRegisterTab] = useState<RegisterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalInitialMode, setModalInitialMode] =
    useState<DocumentMode>("invoice");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const {
    invoices,
    customers,
    quotes,
    loading,
    loadInvoices,
    loadCustomers,
    loadQuotes,
  } = useInvoiceData();

  const {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF,
    printInvoice,
    downloadReceiptPDF,
    printReceipt,
  } = useInvoiceOperations(loadInvoices);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadQuotes();
  }, []);

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status === "paid" || status === "cancelled") return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const q = searchTerm.trim().toLowerCase();
      const receiptNo = getReceiptNumber(invoice.invoice_number).toLowerCase();
      const matchesSearch =
        !q ||
        invoice.invoice_number.toLowerCase().includes(q) ||
        receiptNo.includes(q) ||
        invoice.customer?.company_name?.toLowerCase().includes(q) ||
        invoice.customer?.contact_person?.toLowerCase().includes(q) ||
        invoice.customer?.email?.toLowerCase().includes(q);

      const isOverdue =
        getDaysOverdue(invoice.due_date, invoice.status || "draft") > 0 &&
        invoice.status !== "paid";

      const matchesTab =
        registerTab === "all"
          ? true
          : registerTab === "receipts"
            ? invoice.status === "paid"
            : invoice.status !== "paid";

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "overdue"
            ? isOverdue || invoice.status === "overdue"
            : invoice.status === statusFilter;

      return matchesSearch && matchesTab && matchesStatus;
    });
  }, [invoices, searchTerm, registerTab, statusFilter]);

  const stats = useMemo(() => {
    const totalBilled = invoices
      .filter((i) => i.status !== "cancelled")
      .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
    const paidInvoices = invoices.filter((i) => i.status === "paid");

    return {
      totalInvoices: invoices.length,
      totalBilled,
      paidCount: paidInvoices.length,
      totalOutstanding: invoices
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0),
      totalPaid: paidInvoices.reduce(
        (sum, i) => sum + (Number(i.total_amount) || 0),
        0,
      ),
      overdueCount: invoices.filter((i) => {
        const daysOverdue = getDaysOverdue(i.due_date, i.status || "draft");
        return daysOverdue > 0 && i.status !== "paid";
      }).length,
    };
  }, [invoices]);

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 py-24 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading corporate invoices & official payment receipts...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-600/15">
              Billing & Treasury Desk
            </Badge>
            <span className="text-xs text-muted-foreground">
              Commercial Invoices (INV) & Official Payment Receipts (RCT)
            </span>
          </div>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Invoices & Official Receipts Register
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Generate itemized project invoices, convert approved BOQs, record settlements, and issue stamped A4 payment receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            className="h-10 rounded-xl gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 rounded-xl font-semibold shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Commercial Invoice
          </Button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <StatsCards stats={stats} />

      {/* Document Register Mode Tabs + Search & Filter Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/50 p-1 w-fit">
            <button
              type="button"
              onClick={() => {
                setRegisterTab("all");
                setStatusFilter("all");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                registerTab === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-primary" />
              All Documents ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setRegisterTab("invoices");
                setStatusFilter("all");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                registerTab === "invoices"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              Open Invoices ({invoices.filter((i) => i.status !== "paid").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setRegisterTab("receipts");
                setStatusFilter("paid");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                registerTab === "receipts"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              Official Receipts ({stats.paidCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Statuses" },
              { id: "draft", label: "Draft" },
              { id: "sent", label: "Issued / Sent" },
              { id: "paid", label: "Paid (Receipts)" },
              { id: "overdue", label: "Overdue" },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === pill.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number (INV-...), receipt number (RCT-...), client company, contact person, or email..."
            className="h-10 rounded-xl pl-10 bg-background"
          />
        </div>
      </div>

      {/* Invoices & Receipts Register Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        onViewInvoice={(invoice) => {
          setSelectedInvoice(invoice);
          setModalInitialMode(
            registerTab === "receipts" ? "receipt" : "invoice",
          );
          setShowInvoiceModal(true);
        }}
        onViewReceipt={(invoice) => {
          setSelectedInvoice(invoice);
          setModalInitialMode("receipt");
          setShowInvoiceModal(true);
        }}
        onEditInvoice={openEditModal}
        onDownloadPDF={downloadInvoicePDF}
        onDownloadReceiptPDF={downloadReceiptPDF}
        onPrintInvoice={printInvoice}
        onUpdateStatus={updateInvoiceStatus}
        onDeleteInvoice={deleteInvoice}
        getDaysOverdue={getDaysOverdue}
      />

      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          initialMode={modalInitialMode}
          onClose={() => setShowInvoiceModal(false)}
          onDownloadPDF={downloadInvoicePDF}
          onPrintInvoice={printInvoice}
          onDownloadReceiptPDF={downloadReceiptPDF}
          onPrintReceipt={printReceipt}
          onUpdateStatus={updateInvoiceStatus}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          customers={customers}
          quotes={quotes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadInvoices}
        />
      )}

      {showEditModal && editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          customers={customers}
          quotes={quotes}
          onClose={() => {
            setShowEditModal(false);
            setEditingInvoice(null);
          }}
          onSuccess={loadInvoices}
        />
      )}
    </div>
  );
};

export default InvoiceManagementSystem;

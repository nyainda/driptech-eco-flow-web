import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Invoice } from '../types/InvoiceTypes';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';

import StatsCards from './StatsCards';
import InvoicesTable from './InvoicesTable';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceModal from './InvoiceModal';
//import FiltersSection from './FiltersSection';
import FiltersSection from './FiltersSection ';
import EditInvoiceModal from './EditInvoiceModal';

const InvoiceManagementSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
    loadQuotes
  } = useInvoiceData();

  const {
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoicePDF,
    printInvoice
  } = useInvoiceOperations(loadInvoices);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadQuotes();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const stats = {
    totalInvoices: invoices.length,
    totalOutstanding: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((sum, i) => sum + i.total_amount, 0),
    totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
    overdueCount: invoices.filter(i => {
      const daysOverdue = getDaysOverdue(i.due_date, i.status || 'draft');
      return daysOverdue > 0 && i.status !== 'paid';
    }).length
  };

  const openEditModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-background border-border shadow-lg rounded-2xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="p-2 rounded-xl bg-muted border border-border w-fit">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Invoice Management</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage customer invoices and payments</p>
                <div className="flex items-center gap-4 mt-3 text-muted-foreground">
                  <span className="text-sm">Total Invoices: {stats.totalInvoices}</span>
                  <span className="text-sm">Outstanding: KES {stats.totalOutstanding.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-3" />
              Create New Invoice
            </Button>
          </div>
        </div>

        <StatsCards stats={stats} />

        <FiltersSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRefresh={loadInvoices}
        />

        <InvoicesTable
          invoices={filteredInvoices}
          onViewInvoice={(invoice) => {
            setSelectedInvoice(invoice);
            setShowInvoiceModal(true);
          }}
          onEditInvoice={openEditModal}
          onDownloadPDF={downloadInvoicePDF}
          onUpdateStatus={updateInvoiceStatus}
          onDeleteInvoice={deleteInvoice}
          getDaysOverdue={getDaysOverdue}
        />

        {showInvoiceModal && selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setShowInvoiceModal(false)}
            onDownloadPDF={downloadInvoicePDF}
            onPrintInvoice={printInvoice}
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
    </div>
  );
};

export default InvoiceManagementSystem;
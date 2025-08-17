// InvoiceManagementSystem.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Invoice } from '../types/InvoiceTypes';
import { useInvoiceData } from '@/hooks/useInvoiceData';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';

import StatsCards from './StatsCards';
import InvoicesTable from './InvoicesTable';
import CreateInvoiceModal from './CreateInvoiceModal';
import InvoiceModal from './InvoiceModal';
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
    downloadInvoicePDF
  } = useInvoiceOperations(loadInvoices);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadQuotes();
  }, []);

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate days overdue
  const getDaysOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate stats
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Invoice Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your customer invoices and payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          <StatsCards stats={stats} />
        </div>

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

        {/* Modals */}
        {showInvoiceModal && selectedInvoice && (
          <InvoiceModal
            invoice={selectedInvoice}
            onClose={() => setShowInvoiceModal(false)}
            onDownloadPDF={downloadInvoicePDF}
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
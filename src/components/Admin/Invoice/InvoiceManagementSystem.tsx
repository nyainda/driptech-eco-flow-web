// InvoiceManagementSystem.tsx
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 p-8 text-white shadow-2xl">
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
                  📋
                </div>
                <div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Invoice Management</h1>
                  <p className="text-purple-100 text-lg font-medium opacity-90">Manage customer invoices and payments</p>
                  <div className="flex items-center gap-4 mt-3 text-purple-200">
                    <span className="text-sm">📊 Total Invoices: {stats.totalInvoices}</span>
                    <span className="text-sm">💰 Outstanding: KES {stats.totalOutstanding.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 text-white border-2 border-white border-opacity-30 hover:border-opacity-50 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Invoice
                </Button>
              </div>
            </div>
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

        {/* Modals */}
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
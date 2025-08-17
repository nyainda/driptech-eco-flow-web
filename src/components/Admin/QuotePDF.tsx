import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

// Import all components
import { CompanyHeader } from './Quote/Header';
import { AddressSection } from './Quote/AddressSection';
import { ProjectDetails } from './Quote/ProjectDetails';
import { BOQTable } from './Quote/BillOfQuantities';
import { TotalsSection } from './Quote/Totals';
import { NotesSection } from './Quote/Notes';
//import { TermsSection } from './Quote/TermsAndConditions';
import { Footer } from './Quote/Footer';
import { QuotePDFProps } from './Quote/types';
// Import types and hooks
import { usePrintHandlers } from '@/hooks/usePrintHandlers';

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, items, customer, onEdit }) => {
  const { handlePrint, handleDownloadPDF, isPrinting, isDownloading } = usePrintHandlers();

  return (
    <div className="bg-gray-50 dark:bg-gray-900 print:bg-white min-h-screen">
      {/* Print-only content - Hidden duplicate for printing */}
      <div className="hidden print:block">
        <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <CompanyHeader quote={quote} />
          <AddressSection customer={customer} />
          <ProjectDetails quote={quote} />
          <BOQTable items={items} />
          <TotalsSection quote={quote} items={items} />
          <NotesSection notes={quote.notes} />
          
          <Footer />
        </div>
      </div>

      {/* Screen content */}
      <div className="print:hidden py-12">
        <Card className="max-w-4xl mx-auto border-none shadow-xl bg-white dark:bg-gray-800">
          <CardContent className="p-8">
            <CompanyHeader quote={quote} />
            <AddressSection customer={customer} />
            <ProjectDetails quote={quote} />
            <BOQTable items={items} onEdit={onEdit} />
            <TotalsSection quote={quote} items={items} />
            <NotesSection notes={quote.notes} />
            
            <Footer />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 px-8">
          <Button 
            onClick={() => handlePrint(quote, items, customer)} 
            className="bg-blue-900 dark:bg-blue-800 hover:bg-blue-800 dark:hover:bg-blue-700 text-white flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isPrinting}
          >
            <Printer className="h-5 w-5" />
            {isPrinting ? 'Printing...' : 'Print Quote'}
          </Button>
          
          <Button 
            onClick={() => handleDownloadPDF(quote, items, customer)} 
            variant="outline" 
            className="border-2 border-blue-200 dark:border-blue-600 text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isDownloading}
          >
            <Download className="h-5 w-5" />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 px-8">
          <p>💡 <strong>Tip:</strong> For PDF download, select "Save as PDF" in the print dialog</p>
        </div>
      </div>
    </div>
  );
};
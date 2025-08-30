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
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Enhanced Header for Print */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full"></div>
              <div className="absolute top-8 right-12 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute bottom-6 left-8 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute bottom-12 right-6 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-2xl font-black border-2 border-white border-opacity-30">
                    DT
                  </div>
                  <div>
                    <h1 className="text-2xl font-black mb-1">DripTech Solutions</h1>
                    <p className="text-white text-opacity-90 font-medium">Smart Irrigation Systems</p>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2">QUOTATION</h2>
                  <div className="bg-white bg-opacity-15 backdrop-blur-md p-3 rounded-lg border border-white border-opacity-20">
                    <div className="text-sm font-semibold">Quote #: {quote.quote_number}</div>
                    <div className="text-sm">Date: {new Date(quote.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <AddressSection customer={customer} />
            <ProjectDetails quote={quote} />
            <BOQTable items={items} />
            <TotalsSection quote={quote} items={items} />
            <NotesSection notes={quote.notes} />
            
            <Footer />
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div className="print:hidden py-4 sm:py-8 lg:py-12 px-2 sm:px-4">
        <Card className="max-w-4xl mx-auto border-none shadow-2xl bg-white dark:bg-gray-800 overflow-hidden">
          <CardContent className="p-0">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute top-8 right-12 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute bottom-6 left-8 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute bottom-12 right-6 w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-2xl font-black border-2 border-white border-opacity-30">
                      DT
                    </div>
                    <div>
                      <h1 className="text-2xl font-black mb-1">DripTech Solutions</h1>
                      <p className="text-white text-opacity-90 font-medium">Smart Irrigation Systems</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <h2 className="text-3xl font-black mb-2">QUOTATION</h2>
                    <div className="bg-white bg-opacity-15 backdrop-blur-md p-3 rounded-lg border border-white border-opacity-20">
                      <div className="text-sm font-semibold">Quote #: {quote.quote_number}</div>
                      <div className="text-sm">Date: {new Date(quote.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <AddressSection customer={customer} />
              <ProjectDetails quote={quote} />
              <BOQTable items={items} onEdit={onEdit} />
              <TotalsSection quote={quote} items={items} />
              <NotesSection notes={quote.notes} />
              
              <Footer />
            </div>
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
          <p>💡 <strong>Tip:</strong> Download generates a professional PDF file directly to your computer</p>
        </div>
      </div>
    </div>
  );
};
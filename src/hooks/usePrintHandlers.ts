import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Quote, QuoteItem, Customer } from '@/components/Admin/Quote/types';
import { generatePrintContent } from '@/components/Admin/Quote/PrintActions';

export const usePrintHandlers = () => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = async (quote: Quote, items: QuoteItem[], customer?: Customer) => {
    setIsPrinting(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error('Failed to open print window');
      
      const printContent = generatePrintContent(quote, items, customer);
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
      
      toast({
        title: "Print Initiated",
        description: "Quote is being sent to printer.",
      });
    } catch (error) {
      setIsPrinting(false);
      toast({
        title: "Print Error",
        description: "Failed to initiate printing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (quote: Quote, items: QuoteItem[], customer?: Customer) => {
    setIsDownloading(true);
    try {
      // Generate the HTML content
      const htmlContent = generatePrintContent(quote, items, customer);
      
      // Create a new window for PDF generation (same as print but for PDF)
      const pdfWindow = window.open('', '_blank');
      if (!pdfWindow) throw new Error('Failed to open PDF window');
      
      // Write the HTML content
      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add PDF-specific styles and trigger print to PDF
      const style = pdfWindow.document.createElement('style');
      style.textContent = `
        @media print {
          @page { 
            margin: 0.5cm; 
            size: A4 portrait; 
          }
          body { 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 12px !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;
      pdfWindow.document.head.appendChild(style);
      
      // Show instructions to user for saving as PDF
      const instructionDiv = pdfWindow.document.createElement('div');
      instructionDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 10px; 
          right: 10px; 
          background: #1e40af; 
          color: white; 
          padding: 10px 15px; 
          border-radius: 8px; 
          font-family: Arial, sans-serif; 
          font-size: 14px;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        " class="no-print">
          📄 Press Ctrl+P (Cmd+P on Mac) and select "Save as PDF"
          <button onclick="this.parentElement.remove()" style="
            background: rgba(255,255,255,0.2); 
            border: none; 
            color: white; 
            margin-left: 10px; 
            padding: 2px 8px; 
            border-radius: 4px;
            cursor: pointer;
          ">×</button>
        </div>
      `;
      pdfWindow.document.body.appendChild(instructionDiv);
      
      // Trigger print dialog automatically
      setTimeout(() => {
        pdfWindow.print();
        
        // Close the window after a delay (user can cancel if needed)
        setTimeout(() => {
          try {
            pdfWindow.close();
          } catch (e) {
            // Window might already be closed by user
          }
        }, 1000);
      }, 500);
      
      setIsDownloading(false);
      
      toast({
        title: "PDF Generation Ready",
        description: `Quote ${quote.quote_number} is ready to save as PDF.`,
      });
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setIsDownloading(false);
      toast({
        title: "PDF Generation Error",
        description: "Failed to generate PDF. Please try printing instead.",
        variant: "destructive",
      });
    }
  };

  // Alternative method using browser's built-in PDF generation
  const handleDownloadPDFAlternative = async (quote: Quote, items: QuoteItem[], customer?: Customer) => {
    setIsDownloading(true);
    try {
      const htmlContent = generatePrintContent(quote, items, customer);
      
      // Create blob with HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote-${quote.quote_number}-DripTech.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      setIsDownloading(false);
      
      toast({
        title: "HTML File Downloaded",
        description: `Quote ${quote.quote_number} downloaded as HTML. You can open it and print to PDF.`,
      });
      
    } catch (error) {
      console.error('Download Error:', error);
      setIsDownloading(false);
      toast({
        title: "Download Error",
        description: "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  return {
    handlePrint,
    handleDownloadPDF,
    handleDownloadPDFAlternative, // Alternative method if needed
    isPrinting,
    isDownloading
  };
};
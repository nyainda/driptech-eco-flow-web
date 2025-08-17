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
      // Create a temporary iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Failed to access iframe document');

      // Write the print content to iframe
      const printContent = generatePrintContent(quote, items, customer);
      iframeDoc.write(printContent);
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Focus iframe and trigger print dialog with save as PDF option
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(iframe);
        setIsDownloading(false);
      }, 500);

      toast({
        title: "PDF Download Initiated",
        description: "Please save the PDF from the print dialog.",
      });

    } catch (error) {
      setIsDownloading(false);
      toast({
        title: "PDF Download Error",
        description: "Failed to generate PDF. Please try printing instead.",
        variant: "destructive",
      });
    }
  };

  return {
    handlePrint,
    handleDownloadPDF,
    isPrinting,
    isDownloading
  };
};
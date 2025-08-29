import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Quote, QuoteItem, Customer } from '@/components/Admin/Quote/types';
import { generatePrintContent } from '@/components/Admin/Quote/PrintActions';
import html2pdf from 'html2pdf.js';
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
      // Find the print-only content from the current page
      const printContent = document.querySelector('.print\\:block');
      if (!printContent) {
        throw new Error('Print content not found');
      }

      // Clone the print content
      const contentClone = printContent.cloneNode(true) as HTMLElement;
      
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm';
      tempContainer.style.minHeight = '297mm';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '20px';
      
      // Make the cloned content visible for PDF generation
      contentClone.classList.remove('hidden');
      contentClone.classList.add('block');
      
      tempContainer.appendChild(contentClone);
      document.body.appendChild(tempContainer);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Configure html2pdf options for optimal output
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Quote-${quote.quote_number}-DripTech.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          backgroundColor: 'white'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true
        }
      };

      // Generate and download the PDF
      await html2pdf().set(opt).from(tempContainer).save();
      
      // Clean up
      document.body.removeChild(tempContainer);
      setIsDownloading(false);

      toast({
        title: "PDF Downloaded Successfully",
        description: `Quote ${quote.quote_number} has been downloaded as PDF.`,
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
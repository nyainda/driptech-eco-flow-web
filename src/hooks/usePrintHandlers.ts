import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Quote, QuoteItem, Customer } from "@/components/Admin/Quote/types";
import { generatePrintContent } from "@/components/Admin/Quote/PrintActions";

export const usePrintHandlers = () => {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = async (
    quote: Quote,
    items: QuoteItem[],
    customer?: Customer,
  ) => {
    setIsPrinting(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Failed to open print window");

      const printContent = generatePrintContent(quote, items, customer);
      printWindow.document.write(printContent);
      printWindow.document.close();

      await new Promise((resolve) => setTimeout(resolve, 500));
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

  const handleDownloadPDF = async (
    quote: Quote,
    items: QuoteItem[],
    customer?: Customer,
  ) => {
    setIsDownloading(true);
    try {
      // Use the exact same approach as your working print function
      // This gives crisp text, not scanned images
      const pdfWindow = window.open("", "_blank");
      if (!pdfWindow) throw new Error("Failed to open PDF window");

      const printContent = generatePrintContent(quote, items, customer);
      pdfWindow.document.write(printContent);
      pdfWindow.document.close();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Add a simple instruction banner for mobile users
      const isMobile =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      if (isMobile) {
        const banner = pdfWindow.document.createElement("div");
        banner.innerHTML = `
          <div style="
            position: fixed; 
            top: 0; 
            left: 0; 
            right: 0; 
            background: #1e40af; 
            color: white; 
            padding: 12px; 
            text-align: center; 
            font-family: Arial, sans-serif; 
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          " class="no-print">
            📱 Tap the menu (⋮) → Print → Save as PDF
            <button onclick="this.parentElement.parentElement.remove()" style="
              background: rgba(255,255,255,0.2); 
              border: none; 
              color: white; 
              margin-left: 15px; 
              padding: 4px 12px; 
              border-radius: 4px;
              cursor: pointer;
            ">Got it</button>
          </div>
        `;
        pdfWindow.document.body.insertBefore(
          banner,
          pdfWindow.document.body.firstChild,
        );
      }

      // Trigger print dialog (works on both mobile and desktop)
      setTimeout(() => {
        pdfWindow.print();
      }, 500);

      setIsDownloading(false);

      toast({
        title: "PDF Ready",
        description: `Quote ${quote.quote_number} is ready to save as PDF.`,
      });
    } catch (error) {
      console.error("PDF Error:", error);
      setIsDownloading(false);
      toast({
        title: "PDF Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handlePrint,
    handleDownloadPDF,
    isPrinting,
    isDownloading,
  };
};

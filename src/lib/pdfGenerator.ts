import { Quote, Customer } from "../components/Admin/Quote/types";

interface PDFOptions {
  filename: string;
  showProgress?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Detects if the user is on a mobile device.
 */
export const isMobileDevice = (): boolean =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

const generateFilename = (quote: Quote, customer?: Customer): string => {
  const quoteNum = quote.quote_number.replace(/[^a-zA-Z0-9]/g, "_");
  const customerName =
    customer?.company_name || customer?.contact_person || "Customer";
  const sanitizedCustomer = customerName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 30);
  const date = new Date().toISOString().split("T")[0];
  return `Quote_${quoteNum}_${sanitizedCustomer}_${date}`;
};

const openPrintableQuote = (htmlContent: string, title: string): Window | null => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Please allow pop-ups to print the quote.");
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.title = title;
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
  return printWindow;
};

/**
 * Opens a print-ready quote. The browser's print dialog can save the quote as PDF.
 * This keeps quote export available without bundling the blocked jsPDF dependency.
 */
export const generateQuotePDF = async (
  htmlContent: string,
  quote: Quote,
  customer?: Customer,
  options?: Partial<PDFOptions>,
): Promise<void> => {
  try {
    options?.onProgress?.(25);
    openPrintableQuote(
      htmlContent,
      options?.filename || generateFilename(quote, customer),
    );
    options?.onProgress?.(100);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error("Unable to open the print dialog.");
    console.error("Quote print error:", normalizedError);
    options?.onError?.(normalizedError);
    if (!options?.onError) throw normalizedError;
  }
};

/**
 * Returns a printable HTML blob for callers that need a browser-native fallback.
 */
export const generateQuotePDFBlob = async (
  htmlContent: string,
  _quote: Quote,
  _customer?: Customer,
): Promise<Blob> => new Blob([htmlContent], { type: "text/html;charset=utf-8" });

export const downloadPDFBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

export const openPDFInNewTab = async (
  htmlContent: string,
  quote: Quote,
  customer?: Customer,
): Promise<void> => {
  openPrintableQuote(htmlContent, generateFilename(quote, customer));
};

export default {
  generateQuotePDF,
  generateQuotePDFBlob,
  downloadPDFBlob,
  openPDFInNewTab,
  isMobileDevice,
};
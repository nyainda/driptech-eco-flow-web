import html2pdf from 'html2pdf.js';
import { Quote, QuoteItem, Customer } from '../components/Admin/Quote/types';

interface PDFOptions {
    filename: string;
    showProgress?: boolean;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
}

/**
 * Detects if the user is on a mobile device
 */
const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
};

/**
 * Gets optimized PDF configuration based on device type
 */
const getPDFConfig = (isMobile: boolean) => {
    const baseConfig = {
        margin: isMobile ? 0.3 : 0.5,
        filename: 'quote.pdf',
        image: { type: 'jpeg', quality: isMobile ? 0.85 : 0.95 },
        html2canvas: {
            scale: isMobile ? 1.5 : 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: false,
        },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'portrait',
            compress: true,
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    return baseConfig;
};

/**
 * Generates a sanitized filename for the PDF
 */
const generateFilename = (quote: Quote, customer?: Customer): string => {
    const quoteNum = quote.quote_number.replace(/[^a-zA-Z0-9]/g, '_');
    const customerName = customer?.company_name || customer?.contact_person || 'Customer';
    const sanitizedCustomer = customerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    const date = new Date().toISOString().split('T')[0];

    return `Quote_${quoteNum}_${sanitizedCustomer}_${date}.pdf`;
};

/**
 * Main PDF generation function with mobile optimization
 */
export const generateQuotePDF = async (
    htmlContent: string,
    quote: Quote,
    customer?: Customer,
    options?: Partial<PDFOptions>
): Promise<void> => {
    try {
        const isMobile = isMobileDevice();
        const filename = options?.filename || generateFilename(quote, customer);

        // Show progress if callback provided
        if (options?.onProgress) {
            options.onProgress(10);
        }

        // Create a temporary container for the HTML content
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        document.body.appendChild(container);

        if (options?.onProgress) {
            options.onProgress(30);
        }

        // Get PDF configuration
        const config = getPDFConfig(isMobile);
        config.filename = filename;

        if (options?.onProgress) {
            options.onProgress(50);
        }

        // Generate PDF
        const pdf = html2pdf()
            .set(config)
            .from(container)
            .toPdf();

        if (options?.onProgress) {
            options.onProgress(80);
        }

        // Save the PDF
        await pdf.save();

        if (options?.onProgress) {
            options.onProgress(100);
        }

        // Cleanup
        document.body.removeChild(container);

    } catch (error) {
        console.error('PDF Generation Error:', error);

        if (options?.onError) {
            options.onError(error as Error);
        } else {
            throw error;
        }
    }
};

/**
 * Alternative method: Generate PDF as blob for more control
 */
export const generateQuotePDFBlob = async (
    htmlContent: string,
    quote: Quote,
    customer?: Customer,
    options?: Partial<PDFOptions>
): Promise<Blob> => {
    try {
        const isMobile = isMobileDevice();

        // Create temporary container
        const container = document.createElement('div');
        container.innerHTML = htmlContent;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        // Get PDF configuration
        const config = getPDFConfig(isMobile);

        // Generate PDF as blob
        const pdfBlob = await html2pdf()
            .set(config)
            .from(container)
            .outputPdf('blob');

        // Cleanup
        document.body.removeChild(container);

        return pdfBlob as Blob;

    } catch (error) {
        console.error('PDF Blob Generation Error:', error);
        throw error;
    }
};

/**
 * Download blob as file (useful for mobile browsers)
 */
export const downloadPDFBlob = (blob: Blob, filename: string): void => {
    try {
        // Create blob URL
        const url = URL.createObjectURL(blob);

        // Create temporary link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

    } catch (error) {
        console.error('Download Error:', error);
        throw error;
    }
};

/**
 * Fallback: Open PDF in new tab if download fails (useful for iOS)
 */
export const openPDFInNewTab = async (
    htmlContent: string,
    quote: Quote,
    customer?: Customer
): Promise<void> => {
    try {
        const blob = await generateQuotePDFBlob(htmlContent, quote, customer);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Cleanup after a delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (error) {
        console.error('Open PDF Error:', error);
        throw error;
    }
};

export default {
    generateQuotePDF,
    generateQuotePDFBlob,
    downloadPDFBlob,
    openPDFInNewTab,
    isMobileDevice,
};

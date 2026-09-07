import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2, AlertCircle } from 'lucide-react';
import { Quote, QuoteItem, Customer } from './types';
import { generatePrintContent } from './PrintActions';
import { generateQuotePDF, isMobileDevice, openPDFInNewTab } from '@/lib/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuotePDFActionsProps {
    quote: Quote;
    items: QuoteItem[];
    customer?: Customer;
}

export const QuotePDFActions = ({ quote, items, customer }: QuotePDFActionsProps) => {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleDownloadPDF = async () => {
        try {
            setIsGenerating(true);
            setProgress(0);
            setError(null);

            // Generate HTML content
            const htmlContent = generatePrintContent(quote, items, customer);

            // Generate and download PDF
            await generateQuotePDF(htmlContent, quote, customer, {
                onProgress: (p) => setProgress(p),
                onError: (err) => {
                    console.error('PDF Generation Error:', err);
                    setError(err.message || 'Failed to generate PDF');
                },
            });

            toast({
                title: 'PDF Downloaded',
                description: `Quote #${quote.quote_number} is ready to print or save as a PDF.`,
            });

        } catch (err: any) {
            console.error('Download PDF Error:', err);
            setError(err.message || 'Failed to download PDF. Please try again.');

            toast({
                title: 'Download Failed',
                description: 'There was an error downloading the PDF. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    const handlePrint = () => {
        try {
            const htmlContent = generatePrintContent(quote, items, customer);
            const printWindow = window.open('', '_blank');

            if (printWindow) {
                printWindow.document.write(htmlContent);
                printWindow.document.close();

                // Wait for content to load before printing
                printWindow.onload = () => {
                    printWindow.print();
                };
            } else {
                toast({
                    title: 'Print Failed',
                    description: 'Please allow pop-ups to print the quote.',
                    variant: 'destructive',
                });
            }
        } catch (err) {
            console.error('Print Error:', err);
            toast({
                title: 'Print Failed',
                description: 'There was an error opening the print dialog.',
                variant: 'destructive',
            });
        }
    };

    const handleOpenInNewTab = async () => {
        try {
            setIsGenerating(true);
            setError(null);

            const htmlContent = generatePrintContent(quote, items, customer);
            await openPDFInNewTab(htmlContent, quote, customer);

            toast({
                title: 'PDF Opened',
                description: 'A print-ready quote opened in a new tab.',
            });

        } catch (err: any) {
            console.error('Open PDF Error:', err);
            setError(err.message || 'Failed to open PDF');

            toast({
                title: 'Failed to Open PDF',
                description: 'There was an error opening the PDF.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const isMobile = isMobileDevice();

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating... {progress > 0 && `${Math.round(progress)}%`}
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </>
                    )}
                </Button>

                {!isMobile && (
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                )}

                {isMobile && (
                    <Button
                        onClick={handleOpenInNewTab}
                        variant="outline"
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Open PDF
                    </Button>
                )}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                        <Button
                            variant="link"
                            size="sm"
                            onClick={handleDownloadPDF}
                            className="ml-2 h-auto p-0 text-destructive-foreground underline"
                        >
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {isGenerating && progress > 0 && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default QuotePDFActions;

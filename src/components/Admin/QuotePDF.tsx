import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

import { CompanyHeader } from "./Quote/Header";
import { AddressSection } from "./Quote/AddressSection";
import { ProjectDetails } from "./Quote/ProjectDetails";
import { BOQTable } from "./Quote/BillOfQuantities";
import { TotalsSection } from "./Quote/Totals";
import { NotesSection } from "./Quote/Notes";
import { Footer } from "./Quote/Footer";
import { QuotePDFProps } from "./Quote/types";
import { usePrintHandlers } from "@/hooks/usePrintHandlers";
import { COMPANY, getLogoUrl } from "./shared/companyBrand";

export const QuotePDF: React.FC<QuotePDFProps> = ({
  quote,
  items,
  customer,
  onEdit,
}) => {
  const { handlePrint, handleDownloadPDF, isPrinting, isDownloading } =
    usePrintHandlers();

  return (
    <div className="bg-background min-h-screen print:bg-background">
      <div className="hidden print:block">
        <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-sm overflow-hidden border border-border">
          <div className="p-6 bg-muted border-b border-border">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                  <img src={getLogoUrl({ forPrint: true })} alt={COMPANY.name} className="h-12 w-12 object-contain" />
                </div>
                <div>
                  <h1 className="mb-1 text-2xl font-bold text-foreground">
                    {COMPANY.name}
                  </h1>
                  <p className="font-medium text-muted-foreground">
                    {COMPANY.tagline}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  QUOTATION
                </h2>
                <div className="bg-background border border-border p-3 rounded-lg">
                  <div className="text-sm font-semibold text-foreground">
                    Quote #: {quote.quote_number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Date: {new Date(quote.created_at).toLocaleDateString()}
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

      <div className="print:hidden py-4 sm:py-8 lg:py-12 px-2 sm:px-4">
        <Card className="max-w-4xl mx-auto border-border shadow-lg bg-background overflow-hidden">
          <CardContent className="p-0">
            <div className="p-8 bg-muted border-b border-border">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                    <img src={getLogoUrl({ forPrint: true })} alt={COMPANY.name} className="h-12 w-12 object-contain" />
                  </div>
                  <div>
                    <h1 className="mb-1 text-2xl font-bold text-foreground">
                      {COMPANY.name}
                    </h1>
                    <p className="font-medium text-muted-foreground">
                      {COMPANY.tagline}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    QUOTATION
                  </h2>
                  <div className="bg-background border border-border p-3 rounded-lg">
                    <div className="text-sm font-semibold text-foreground">
                      Quote #: {quote.quote_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Date: {new Date(quote.created_at).toLocaleDateString()}
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

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 px-8">
          <Button
            onClick={() => handlePrint(quote, items, customer)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isPrinting}
          >
            <Printer className="h-5 w-5" />
            {isPrinting ? "Printing..." : "Print Quote"}
          </Button>

          <Button
            onClick={() => handleDownloadPDF(quote, items, customer)}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isDownloading}
          >
            <Download className="h-5 w-5" />
            {isDownloading ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground px-8">
          <p>
            💡 <strong>Tip:</strong> Download generates a professional PDF file
            directly to your computer
          </p>
        </div>
      </div>
    </div>
  );
};

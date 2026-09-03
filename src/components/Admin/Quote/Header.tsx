import React from "react";
import { Quote } from "./types";
import { COMPANY, getLogoUrl } from "../shared/companyBrand";

interface CompanyHeaderProps {
  quote: Quote;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ quote }) => (
  <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border">
        <img
          src={getLogoUrl()}
          alt={COMPANY.name}
          className="h-10 w-10 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {COMPANY.name}
        </h1>
        <p className="text-sm text-muted-foreground">{COMPANY.tagline}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {COMPANY.phone} · {COMPANY.email}
        </p>
      </div>
    </div>
    <div className="text-left md:text-right">
      <h2 className="text-xl font-semibold text-primary sm:text-2xl">QUOTATION</h2>
      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
        <p className="text-sm font-medium text-foreground">
          Quote #: {quote.quote_number}
        </p>
        <p className="text-sm text-muted-foreground">
          Date: {new Date(quote.created_at).toLocaleDateString()}
        </p>
        {quote.valid_until && (
          <p className="text-sm text-muted-foreground">
            Valid Until: {new Date(quote.valid_until).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  </div>
);

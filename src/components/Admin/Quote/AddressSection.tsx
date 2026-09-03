import React from "react";
import { Customer } from "./types";
import { COMPANY } from "../shared/companyBrand";

interface AddressSectionProps {
  customer?: Customer;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ customer }) => (
  <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
    <div>
      <h3 className="mb-3 text-lg font-semibold text-primary">From:</h3>
      <div className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
        <p className="font-medium text-foreground">{COMPANY.name}</p>
        <p className="text-muted-foreground">{COMPANY.address}</p>
        <p className="text-muted-foreground">Phone: {COMPANY.phone}</p>
        <p className="text-muted-foreground">Email: {COMPANY.email}</p>
        <p className="text-muted-foreground">Alt Email: {COMPANY.emailAlt}</p>
      </div>
    </div>
    <div>
      <h3 className="mb-3 text-lg font-semibold text-primary">To:</h3>
      <div className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
        {customer ? (
          <>
            <p className="font-medium text-foreground">
              {customer.contact_person}
            </p>
            {customer.company_name && (
              <p className="text-muted-foreground">{customer.company_name}</p>
            )}
            {customer.address && (
              <p className="text-muted-foreground">{customer.address}</p>
            )}
            {customer.city && (
              <p className="text-muted-foreground">{customer.city}</p>
            )}
            {customer.country && (
              <p className="text-muted-foreground">{customer.country}</p>
            )}
            {customer.phone && (
              <p className="text-muted-foreground">Phone: {customer.phone}</p>
            )}
            <p className="text-muted-foreground">Email: {customer.email}</p>
          </>
        ) : (
          <p className="text-muted-foreground">Customer information not available</p>
        )}
      </div>
    </div>
  </div>
);

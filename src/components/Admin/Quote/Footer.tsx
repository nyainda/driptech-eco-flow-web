import React from "react";
import { COMPANY } from "../shared/companyBrand";

export const Footer: React.FC = () => (
  <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
    <p className="font-semibold text-foreground">
      {COMPANY.name} — {COMPANY.tagline}
    </p>
    <p>
      Phone: {COMPANY.phone} | Email: {COMPANY.email}
    </p>
  </div>
);

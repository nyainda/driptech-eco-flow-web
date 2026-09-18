import React from "react";
import { Customer, Invoice, Quote } from "../types/InvoiceTypes";
import InvoiceEditorModal from "./InvoiceEditorModal";

interface EditInvoiceModalProps {
  invoice: Invoice;
  customers: Customer[];
  quotes: Quote[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = (props) => (
  <InvoiceEditorModal {...props} />
);

export default EditInvoiceModal;
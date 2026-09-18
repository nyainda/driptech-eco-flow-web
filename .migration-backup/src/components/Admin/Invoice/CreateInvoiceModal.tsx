import React from "react";
import { Customer, Quote } from "../types/InvoiceTypes";
import InvoiceEditorModal from "./InvoiceEditorModal";

interface CreateInvoiceModalProps {
  customers: Customer[];
  quotes: Quote[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = (props) => (
  <InvoiceEditorModal {...props} />
);

export default CreateInvoiceModal;
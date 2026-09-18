// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Generate invoice number
export const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9999) + 1;
  return `INV-${year}${month}-${String(random).padStart(4, "0")}`;
};

// Calculate item total
export const calculateItemTotal = (quantity: number, unitPrice: number) => {
  return quantity * unitPrice;
};

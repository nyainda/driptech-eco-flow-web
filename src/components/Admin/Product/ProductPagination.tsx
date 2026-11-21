import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => {
  if (totalItems === 0 || totalPages <= 0) return null;

  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems);

  const visiblePages: number[] = [];
  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }
  for (let p = start; p <= end; p++) {
    visiblePages.push(p);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm">
      <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing <strong className="text-foreground">{firstItem}</strong>–
        <strong className="text-foreground">{lastItem}</strong> of{" "}
        <strong className="text-foreground">{totalItems}</strong> products
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {start > 1 && (
          <>
            <Button
              type="button"
              variant={currentPage === 1 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
              className="h-8 w-8 p-0 text-xs"
            >
              1
            </Button>
            {start > 2 && (
              <span className="px-1 text-xs text-muted-foreground">…</span>
            )}
          </>
        )}

        {visiblePages.map((pageNumber) => {
          const active = pageNumber === currentPage;
          return (
            <Button
              key={pageNumber}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className={`h-8 w-8 p-0 text-xs ${
                active
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  : ""
              }`}
            >
              {pageNumber}
            </Button>
          );
        })}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-xs text-muted-foreground">…</span>
            )}
            <Button
              type="button"
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 p-0 text-xs"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 text-xs"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-3.5 w-3.5 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default ProductPagination;

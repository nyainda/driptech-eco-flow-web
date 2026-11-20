import { lazy, Suspense, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const QuoteForm = lazy(() => import("./QuoteForm"));

interface QuoteModalProps {
  children: React.ReactNode;
}

const QuoteModal = ({ children }: QuoteModalProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get Your Custom Quote</DialogTitle>
          <DialogDescription>
            Fill out the form below and we'll provide a detailed quote tailored
            to your irrigation needs.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {open ? (
            <Suspense
              fallback={
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading quote form...
                </div>
              }
            >
              <QuoteForm onSuccess={handleSuccess} />
            </Suspense>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteModal;

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inputClasses, labelClasses } from "@/lib/constants";
import { get, post } from "@/lib/apiService";
import { Loader2 } from "lucide-react";
import SuccessToast from "../toasts/SuccessToast";

interface IBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
}

const BarcodeModal: React.FC<IBarcodeModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemName
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [barcodeSeriesList, setBarcodeSeriesList] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch Barcode Series
  useEffect(() => {
    if (isOpen) {
      const fetchSeries = async () => {
        try {
          const result = await get("/inventory/barcode-series");
          setBarcodeSeriesList(result.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchSeries();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isSelect =
        target.closest('[role="combobox"]') ||
        target.closest('[role="listbox"]') ||
        target.closest("[data-radix-popper-content-wrapper]");

      if (modalRef.current && !modalRef.current.contains(target) && !isSelect) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const validation: Record<string, string> = {};
    if (!fd.get("barcodeSeries")) validation.barcodeSeries = "Required";
    if (!fd.get("quantity")) validation.quantity = "Required";
    if (!fd.get("prefix")) validation.prefix = "Required";
    if (!fd.get("suffix")) validation.suffix = "Required";
    if (!fd.get("manufacturingDate")) validation.manufacturingDate = "Required";
    if (!fd.get("expiryDate")) validation.expiryDate = "Required";

    if (Object.keys(validation).length > 0) {
      setFormErrors(validation);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      itemId,
      itemName,
      barcodeSeries: fd.get("barcodeSeries"),
      quantity: Number(fd.get("quantity")),
      prefix: fd.get("prefix"),
      suffix: fd.get("suffix"),
      manufacturingDate: fd.get("manufacturingDate"),
      expiryDate: fd.get("expiryDate"),
    };

    try {
      const result = await post("/inventory/generate-barcode", payload);

        if (result?.data?.success) {
            SuccessToast({
                title: "Barcode generated successfully.",
                description: "",
            });
        }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate barcode.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
      <div ref={modalRef} className="bg-white w-full max-w-xl animate-in fade-in duration-200">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generate Barcode</h3>
            <div className="flex gap-2">
              <Button onClick={onClose} type="button" variant="outline" className="h-8">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#7047EB] h-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto">

            {/* Barcode Series */}
            <div className="space-y-1">
              <Label className={labelClasses}>Barcode Series</Label>
              <Select name="barcodeSeries">
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select Series" />
                </SelectTrigger>
                <SelectContent>
                  {barcodeSeriesList.map((series) => (
                    <SelectItem key={series.id} value={series.id.toString()}>
                      {series.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.barcodeSeries && <p className="text-red-500 text-xs">{formErrors.barcodeSeries}</p>}
            </div>

            {/* Item ID */}
            <div className="space-y-1">
              <Label className={labelClasses}>Item ID</Label>
              <Input value={itemId} readOnly className={inputClasses} />
            </div>

            {/* Item Name */}
            <div className="space-y-1">
              <Label className={labelClasses}>Item Name</Label>
              <Input value={itemName} readOnly className={inputClasses} />
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label className={labelClasses}>Quantity</Label>
              <Input name="quantity" type="number" className={inputClasses} />
              {formErrors.quantity && <p className="text-red-500 text-xs">{formErrors.quantity}</p>}
            </div>

            {/* Prefix & Suffix */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Prefix</Label>
                <Input name="prefix" className={inputClasses} />
                {formErrors.prefix && <p className="text-red-500 text-xs">{formErrors.prefix}</p>}
              </div>

              <div className="w-full space-y-1">
                <Label className={labelClasses}>Suffix</Label>
                <Input name="suffix" className={inputClasses} />
                {formErrors.suffix && <p className="text-red-500 text-xs">{formErrors.suffix}</p>}
              </div>
            </div>

            {/* Manufacturing Date */}
            <div className="space-y-1">
              <Label className={labelClasses}>Manufacturing Date</Label>
              <Input name="manufacturingDate" type="date" className={inputClasses} />
              {formErrors.manufacturingDate && <p className="text-red-500 text-xs">{formErrors.manufacturingDate}</p>}
            </div>

            {/* Expiry Date */}
            <div className="space-y-1">
              <Label className={labelClasses}>Expiry Date</Label>
              <Input name="expiryDate" type="date" className={inputClasses} />
              {formErrors.expiryDate && <p className="text-red-500 text-xs">{formErrors.expiryDate}</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BarcodeModal;

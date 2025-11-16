import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";

interface AdditionalPrices {
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
}

interface IEditDefaultPricesModal extends IModalProps {
  onSave: (prices: AdditionalPrices) => void;
  initialPrices: AdditionalPrices;
}

const EditDefaultPricesModal: React.FC<IEditDefaultPricesModal> = ({
  isOpen,
  onClose,
  onSave,
  initialPrices,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle outside click to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const prices: AdditionalPrices = {
      regularBuyingPrice: Number(formData.get("regularBuyingPrice")) || 0,
      regularSellingPrice: Number(formData.get("regularSellingPrice")) || 0,
      wholesaleBuyingPrice: Number(formData.get("wholesaleBuyingPrice")) || 0,
      mrp: Number(formData.get("mrp")) || 0,
      dealerPrice: Number(formData.get("dealerPrice")) || 0,
      distributorPrice: Number(formData.get("distributorPrice")) || 0,
    };

    onSave(prices);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-center items-center z-[60]">
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between gap-3 rounded-t-lg">
            <h3 className="text-lg font-semibold">Edit Additional Prices</h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="shadow-none text-sm h-9 font-normal"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#7047EB] text-sm h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Regular Buying Price and Regular Selling Price */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="regularBuyingPrice">
                  Regular Buying Price
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="regularBuyingPrice"
                  id="regularBuyingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.regularBuyingPrice}
                />
                {formErrors.regularBuyingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.regularBuyingPrice}
                  </p>
                )}
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="regularSellingPrice">
                  Regular Selling Price
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="regularSellingPrice"
                  id="regularSellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.regularSellingPrice}
                />
                {formErrors.regularSellingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.regularSellingPrice}
                  </p>
                )}
              </div>
            </div>

            {/* Wholesale Buying Price and MRP */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="wholesaleBuyingPrice">
                  Wholesale Buying Price
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="wholesaleBuyingPrice"
                  id="wholesaleBuyingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.wholesaleBuyingPrice}
                />
                {formErrors.wholesaleBuyingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.wholesaleBuyingPrice}
                  </p>
                )}
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="mrp">
                  MRP
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="mrp"
                  id="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.mrp}
                />
                {formErrors.mrp && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.mrp}</p>
                )}
              </div>
            </div>

            {/* Dealer Price and Distributor Price */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="dealerPrice">
                  Dealer Price
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="dealerPrice"
                  id="dealerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.dealerPrice}
                />
                {formErrors.dealerPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.dealerPrice}
                  </p>
                )}
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses} htmlFor="distributorPrice">
                  Distributor Price
                </Label>
                <Input
                  className={`${inputClasses} border border-neutral-200`}
                  name="distributorPrice"
                  id="distributorPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={initialPrices.distributorPrice}
                />
                {formErrors.distributorPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.distributorPrice}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDefaultPricesModal;

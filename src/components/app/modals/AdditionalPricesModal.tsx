import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import React, { useRef, useState, useEffect } from "react";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";

interface AdditionalPrices {
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
}

interface IAdditionalPricesModal extends IModalProps {
  onSave: (prices: AdditionalPrices) => void;
  initialPrices?: AdditionalPrices;
}

const AdditionalPricesModal: React.FC<IAdditionalPricesModal> = ({
  isOpen,
  onClose,
  onSave,
  initialPrices,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Controlled input state
  const [regularBuyingPrice, setRegularBuyingPrice] = useState<string>("");
  const [regularSellingPrice, setRegularSellingPrice] = useState<string>("");
  const [wholesaleBuyingPrice, setWholesaleBuyingPrice] = useState<string>("");
  const [mrp, setMrp] = useState<string>("");
  const [dealerPrice, setDealerPrice] = useState<string>("");
  const [distributorPrice, setDistributorPrice] = useState<string>("");

  // Error state
  const [errors, setErrors] = useState({
    regularBuyingPrice: "",
    regularSellingPrice: "",
    wholesaleBuyingPrice: "",
    mrp: "",
    dealerPrice: "",
    distributorPrice: "",
  });

  // Initialize form with existing prices when modal opens
  useEffect(() => {
    if (isOpen && initialPrices) {
      setRegularBuyingPrice(initialPrices.regularBuyingPrice?.toString() || "");
      setRegularSellingPrice(
        initialPrices.regularSellingPrice?.toString() || "",
      );
      setWholesaleBuyingPrice(
        initialPrices.wholesaleBuyingPrice?.toString() || "",
      );
      setMrp(initialPrices.mrp?.toString() || "");
      setDealerPrice(initialPrices.dealerPrice?.toString() || "");
      setDistributorPrice(initialPrices.distributorPrice?.toString() || "");
    }
  }, [isOpen, initialPrices]);

  const validateFields = () => {
    const newErrors = {
      regularBuyingPrice: "",
      regularSellingPrice: "",
      wholesaleBuyingPrice: "",
      mrp: "",
      dealerPrice: "",
      distributorPrice: "",
    };

    // Optional validation - you can add specific rules if needed
    // For now, just checking if values are valid numbers when provided
    const validatePrice = (value: string, fieldName: string) => {
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        newErrors[fieldName as keyof typeof newErrors] =
          "Please enter a valid price";
      }
    };

    validatePrice(regularBuyingPrice, "regularBuyingPrice");
    validatePrice(regularSellingPrice, "regularSellingPrice");
    validatePrice(wholesaleBuyingPrice, "wholesaleBuyingPrice");
    validatePrice(mrp, "mrp");
    validatePrice(dealerPrice, "dealerPrice");
    validatePrice(distributorPrice, "distributorPrice");

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      ErrorToast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
      });
      return;
    }

    try {
      const prices: AdditionalPrices = {
        regularBuyingPrice: Number(regularBuyingPrice) || 0,
        regularSellingPrice: Number(regularSellingPrice) || 0,
        wholesaleBuyingPrice: Number(wholesaleBuyingPrice) || 0,
        mrp: Number(mrp) || 0,
        dealerPrice: Number(dealerPrice) || 0,
        distributorPrice: Number(distributorPrice) || 0,
      };

      onSave(prices);

      SuccessToast({
        title: "Success",
        description: "Additional prices saved successfully",
      });

      onClose();
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Failed to save additional prices",
      });
      console.error("Save error:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    switch (field) {
      case "regularBuyingPrice":
        setRegularBuyingPrice(value);
        break;
      case "regularSellingPrice":
        setRegularSellingPrice(value);
        break;
      case "wholesaleBuyingPrice":
        setWholesaleBuyingPrice(value);
        break;
      case "mrp":
        setMrp(value);
        break;
      case "dealerPrice":
        setDealerPrice(value);
        break;
      case "distributorPrice":
        setDistributorPrice(value);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-50 p-10 py-16">
      <div
        className="bg-white rounded-lg w-full max-h-[70dvh] md:max-h-[85dvh] max-w-2xl overflow-y-auto pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 bg-neutral-100/90 rounded-t-lg py-4 flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-lg font-semibold">
              Additional Prices
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#7047EB] text-xs sm:text-sm h-7 sm:h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
              >
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="regularBuyingPrice">
                  Regular Buying Price
                </Label>
                <Input
                  id="regularBuyingPrice"
                  name="regularBuyingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.regularBuyingPrice ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={regularBuyingPrice}
                  onChange={(e) =>
                    handleInputChange("regularBuyingPrice", e.target.value)
                  }
                />
                {errors.regularBuyingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regularBuyingPrice}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="regularSellingPrice">
                  Regular Selling Price
                </Label>
                <Input
                  id="regularSellingPrice"
                  name="regularSellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.regularSellingPrice ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={regularSellingPrice}
                  onChange={(e) =>
                    handleInputChange("regularSellingPrice", e.target.value)
                  }
                />
                {errors.regularSellingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.regularSellingPrice}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="wholesaleBuyingPrice">
                  Wholesale Buying Price
                </Label>
                <Input
                  id="wholesaleBuyingPrice"
                  name="wholesaleBuyingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.wholesaleBuyingPrice ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={wholesaleBuyingPrice}
                  onChange={(e) =>
                    handleInputChange("wholesaleBuyingPrice", e.target.value)
                  }
                />
                {errors.wholesaleBuyingPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.wholesaleBuyingPrice}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="mrp">
                  MRP (Maximum Retail Price)
                </Label>
                <Input
                  id="mrp"
                  name="mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.mrp ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={mrp}
                  onChange={(e) => handleInputChange("mrp", e.target.value)}
                />
                {errors.mrp && (
                  <p className="text-red-500 text-xs mt-1">{errors.mrp}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="dealerPrice">
                  Dealer Price
                </Label>
                <Input
                  id="dealerPrice"
                  name="dealerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.dealerPrice ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={dealerPrice}
                  onChange={(e) =>
                    handleInputChange("dealerPrice", e.target.value)
                  }
                />
                {errors.dealerPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.dealerPrice}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="distributorPrice">
                  Distributor Price
                </Label>
                <Input
                  id="distributorPrice"
                  name="distributorPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`${inputClasses} w-full ${errors.distributorPrice ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="0.00"
                  value={distributorPrice}
                  onChange={(e) =>
                    handleInputChange("distributorPrice", e.target.value)
                  }
                />
                {errors.distributorPrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.distributorPrice}
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

export default AdditionalPricesModal;

import React, { useRef, useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import {get,post} from "../../../lib/apiService"
interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateStockTransferModal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [itemId, setItemId] = useState<string>("");
  const [fromWarehouseId, setFromWarehouseId] = useState<string>("");
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);

  // Error states for validation
  const [errors, setErrors] = useState({
    itemId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    quantity: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      try {
     
        const data = await get("/inventory/item");
        if (data?.status) {
          setItems(data.data);
          console.log("Fetched items:", data.data);
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
        ErrorToast({
          title: "Error",
          description: "Failed to fetch items",
        });
      }
    };

    fetchItems();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWarehouses = async () => {
      try {
     
        const data = await get("/inventory/warehouse");
        if (data?.status) {
          setWarehouses(data.data);
          console.log("Fetched warehouses:", data.data);
        }
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
        ErrorToast({
          title: "Error",
          description: "Failed to fetch warehouses",
        });
      }
    };

    fetchWarehouses();
  }, [isOpen]);

  const validateFields = () => {
    const newErrors = {
      itemId: "",
      fromWarehouseId: "",
      toWarehouseId: "",
      quantity: "",
    };

    if (!itemId) {
      newErrors.itemId = "Please select an item";
    }

    if (!fromWarehouseId) {
      newErrors.fromWarehouseId = "Please select source warehouse";
    }

    if (!toWarehouseId) {
      newErrors.toWarehouseId = "Please select destination warehouse";
    }

    if (fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId) {
      newErrors.toWarehouseId =
        "Destination warehouse must be different from source warehouse";
    }

    if (!quantity || quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async () => {
  if (!validateFields()) {
    return;
  }

  try {
    setIsLoading(true);
    const payload = {
      itemId: Number(itemId),
      fromWarehouseId: Number(fromWarehouseId),
      toWarehouseId: Number(toWarehouseId),
      quantity: Number(quantity),
    };

    const result = await post("/inventory/transfer", payload);
    console.log("Transfer result:", result);

    if (result.status) {
      SuccessToast({
        title: "Success",
        description: "Stock transfer request created successfully",
      });
      // Reset form
      setItemId("");
      setFromWarehouseId("");
      setToWarehouseId("");
      setQuantity(0);
      setErrors({
        itemId: "",
        fromWarehouseId: "",
        toWarehouseId: "",
        quantity: "",
      });
      onClose();
    } else {
      // Show the actual error message from API
      const errorMessage = result?.message || "Failed to create transfer stock request";
      
      ErrorToast({
        title: "Transfer Failed",
        description: errorMessage,
      });
      
      // Also show as a form error for better UX
      if (errorMessage.includes("Insufficient stock")) {
        setErrors(prev => ({
          ...prev,
          quantity: errorMessage // Show the error under quantity field
        }));
      }
    }
  } catch (err: any) {
    console.error("Failed to create transfer stock request:", err);
    
    // Extract error message from different error formats
    let errorMessage = "Failed to create transfer stock request. Please try again.";
    
    if (err?.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err?.message) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    ErrorToast({
      title: "Error",
      description: errorMessage,
    });
    
    // Show as form error if it's about insufficient stock
    if (errorMessage.includes("Insufficient stock")) {
      setErrors(prev => ({
        ...prev,
        quantity: errorMessage
      }));
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-xl animate-in fade-in duration-200"
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex justify-between items-center">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Stock Transfer
          </h4>
          <X
            className={`text-[#8A8AA3] w-5 ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            onClick={handleClose}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Item Selection */}
          <div>
            <Label className={labelClasses}>
              Select Item<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={itemId}
              onValueChange={(value) => {
                setItemId(value);
                clearError("itemId");
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`${inputClasses} w-full ${errors.itemId ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.itemId && (
              <p className="text-red-500 text-xs mt-1">{errors.itemId}</p>
            )}
          </div>

          {/* From Warehouse */}
          <div>
            <Label className={labelClasses}>
              From Warehouse<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={fromWarehouseId}
              onValueChange={(value) => {
                setFromWarehouseId(value);
                clearError("fromWarehouseId");
                // Clear toWarehouse error if it was about same warehouse
                if (errors.toWarehouseId.includes("different")) {
                  clearError("toWarehouseId");
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`${inputClasses} w-full ${errors.fromWarehouseId ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select source warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={String(wh.id)}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.fromWarehouseId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.fromWarehouseId}
              </p>
            )}
          </div>

          {/* To Warehouse */}
          <div>
            <Label className={labelClasses}>
              To Warehouse<span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={toWarehouseId}
              onValueChange={(value) => {
                setToWarehouseId(value);
                clearError("toWarehouseId");
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`${inputClasses} w-full ${errors.toWarehouseId ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select destination warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={String(wh.id)}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.toWarehouseId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.toWarehouseId}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label className={labelClasses}>
              Quantity<span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              type="number"
              className={`${inputClasses} w-full ${errors.quantity ? "border-red-500" : ""}`}
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                clearError("quantity");
              }}
              min={1}
              disabled={isLoading}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full mt-4 bg-[#7047EB] text-white py-2 rounded-md hover:bg-[#5a37c6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Submit Transfer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStockTransferModal;

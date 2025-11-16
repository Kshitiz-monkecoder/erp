import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import { Plus, Loader2 } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import SuccessToast from "../toasts/SuccessToast";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
// import AdditionalPricesModal from "./AdditionalPricesModal"; // Update path as needed

import {get,post} from "../../../lib/apiService"
type Unit = {
  id: number;
  name: string;
  description: string;
  uom: string;
  status: boolean;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
};

type ItemCategory = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};

type taxtype = {
  id: number;
  name: string;
  rate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

interface AdditionalPrices {
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
}

interface IAddPurchaseItemModal extends IModalProps {
  // showAddUnitOfMeasurementModal: () => void;
  // showAddWarehouseModal: () => void;
  // showShowCategoriesModal: () => void;
  // currentItemNo: number;
  // isAnyModalOpen: boolean;
}

const AddPurchaseItemModal: React.FC<IAddPurchaseItemModal> = ({
  isOpen,
  onClose,
  // showAddUnitOfMeasurementModal,
  // showAddWarehouseModal,
  // showShowCategoriesModal,
  // currentItemNo,
  // isAnyModalOpen,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Select options
  const [unitOfMeasurements, setUnitOfMeasurements] = useState<Unit[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [taxTypes, setTaxTypes] = useState<taxtype[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Additional Prices Modal State
  const [isAdditionalPricesModalOpen, setIsAdditionalPricesModalOpen] =
    useState(false);
  const [additionalPrices] = useState<AdditionalPrices>({
    regularBuyingPrice: 0,
    regularSellingPrice: 0,
    wholesaleBuyingPrice: 0,
    mrp: 0,
    dealerPrice: 0,
    distributorPrice: 0,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is on a Select component or its dropdown
      const target = event.target as HTMLElement;
      const isSelectComponent =
        target.closest('[role="combobox"]') ||
        target.closest('[role="listbox"]') ||
        target.closest("[data-radix-popper-content-wrapper]");

      // Only close if it's outside the modal AND not on a select component
      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        !isSelectComponent &&
        // !isAnyModalOpen &&
        !isAdditionalPricesModalOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isAdditionalPricesModalOpen]);

  useEffect(() => {
    if (isOpen) {
      const fetchUnitOfMeasurements = async () => {
        try {
        
          const result = await get("/inventory/unit");
          console.log(result);
          setUnitOfMeasurements(result.data as Unit[]);
        } catch (error) {
          console.error("Error fetching unit of measurements:", error);
        }
      };

      const fetchItemCategories = async () => {
        try {
          
          const result = await get("/inventory/categories");
          console.log(result);
          setItemCategories(result.data as ItemCategory[]);
        } catch (error) {
          console.error("Error fetching item categories:", error);
        }
      };

      const fetchWarehouses = async () => {
        try {
          const result = await get("/inventory/warehouse");
          console.log(result);
          setWarehouses(result.data as warehouse[]);
        } catch (error) {
          console.error("Error fetching warehouses:", error);
        }
          
      };

      const fetchTaxTypes = async () => {
        try {
          
          const result = await get("/superadmin/tax");
          console.log(result);
          setTaxTypes(result.data as taxtype[]);
        } catch (error) {
          console.error("Error fetching tax types:", error);
        }
      };
      fetchUnitOfMeasurements();
      fetchItemCategories();
      fetchWarehouses();
      fetchTaxTypes();
    }
  }, [
    isOpen,
    // showAddUnitOfMeasurementModal,
    // showAddWarehouseModal,
    // showShowCategoriesModal,
  ]);

  if (!isOpen) return null;

  // const handleAdditionalPricesSave = (prices: AdditionalPrices) => {
  //   setAdditionalPrices(prices);
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null); // Clear previous errors
    setFormErrors({}); // Clear previous form errors

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    const newErrors: Record<string, string> = {};
    console.log(formData.get("defaultPrice"));
    if (!formData.get("itemId")) newErrors.itemId = "Item ID is required.";
    if (!formData.get("itemName"))
      newErrors.itemName = "Item Name is required.";
    if (!formData.get("productServices"))
      newErrors.productServices = "Select Product or Service.";
    if (!formData.get("buySellBoth"))
      newErrors.buySellBoth = "Please choose an option.";
    if (!formData.get("unitOfMeasurement"))
      newErrors.unitOfMeasurement = "Unit of Measurement is required.";
    if (!formData.get("warehouse"))
      newErrors.warehouse = "Warehouse is required.";
    if (!formData.get("maximumStockLevel"))
      newErrors.maximumStockLevel = "Max stock level is required.";
    if (!formData.get("minimumStockLevel"))
      newErrors.minimumStockLevel = "Min stock level is required.";

    if (!formData.get("hsnCode")) newErrors.hsnCode = "HSN Code is required.";

    if (!formData.get("itemCategory"))
      newErrors.itemCategory = "Item Category is required.";
    if (!formData.get("currentStock"))
      newErrors.currentStock = "Current stock is required.";
    if (!formData.get("defaultPrice"))
      newErrors.defaultPrice = "Default price is required.";
    if (!formData.get("tax")) newErrors.tax = "Tax is required.";
    if (!formData.get("defaultPrice") || formData.get("defaultPrice") == " ")
      newErrors.defaultPrice = "Default price is required.";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      sku: formData.get("itemId") as string,
      name: formData.get("itemName") as string,
      isProduct: formData.get("productServices") === "product",
      type: formData.get("buySellBoth") as string,
      unit: Number(formData.get("unitOfMeasurement")),
      category: formData.get("itemCategory"),
      currentStock: Number(formData.get("currentStock")),
      defaultPrice: Number(formData.get("defaultPrice")),
      hsnCode: formData.get("hsnCode") as string,
      tax: Number(formData.get("tax") as string) || 0,
      minimumStockLevel: Number(formData.get("minimumStockLevel")),
      maximumStockLevel: Number(formData.get("maximumStockLevel")),
      // Include additional prices from state
      regularBuyingPrice: additionalPrices.regularBuyingPrice,
      regularSellingPrice: additionalPrices.regularSellingPrice,
      wholesaleBuyingPrice: additionalPrices.wholesaleBuyingPrice,
      mrp: additionalPrices.mrp,
      dealerPrice: additionalPrices.dealerPrice,
      distributorPrice: additionalPrices.distributorPrice,
      warehouse: formData.get("warehouse"),
    };

    try {
      console.log(payload);
     

      const result = await post("/inventory/item", payload);
      if (result.status) {
        console.log("Item created:", result);
        SuccessToast({
          title: "Item has been added successfully.",
          description: "",
        });
        onClose();
      } else {
        console.error("Error creating item:", result);
        setError(result.message || "Failed to create item. Please try again.");
      }
    } catch (err) {
      console.error("Request failed:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-end z-50">
        <div
          className="bg-white w-full max-w-xl animate-in fade-in duration-200"
          ref={modalRef}
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="sm:text-lg font-semibold">Item Details</h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#7047EB] text-xs sm:text-sm h-7 sm:h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
                  disabled={isSubmitting}
                >
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

            {/* API Error Display */}
            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Form content remains the same */}
            <div className="px-4 py-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
              <div
                className="flex justify-center items-center mx-auto text-sm"
                style={{ minHeight: "1.5rem" }}
              >
                {error && <span className="text-red-500">{error}</span>}
              </div>

              {/* All your existing form fields remain exactly the same */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="itemId">
                    Item ID
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="itemId"
                    id="itemId"
                    defaultValue={`ITEM-00`}
                  />
                  {formErrors.itemId && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.itemId}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="itemName">
                    Item Name
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="itemName"
                    id="itemName"
                  />
                  {formErrors.itemName && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.itemName}
                    </p>
                  )}
                </div>
              </div>

              {/* Continue with all your existing form fields... */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="productServices">
                    Product/Services
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Select name="productServices" defaultValue="product">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.productServices && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.productServices}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="buySellBoth">
                    Buy/Sell/Both
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Select name="buySellBoth">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buyer">Buyer</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.buySellBoth && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.buySellBoth}
                    </p>
                  )}
                </div>
              </div>

              {/* Unit of Measurement and Item Category */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="w-full space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <Label className={labelClasses} htmlFor="unitOfMeasurement">
                      Unit of Measurement (UoM)
                      <span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <div
                      // onClick={showAddUnitOfMeasurementModal}
                      className="text-xs flex items-center text-[#7047EB] underline underline-offset-2 cursor-pointer"
                    >
                      <Plus className="w-3" /> Add
                    </div>
                  </div>
                  <Select name="unitOfMeasurement">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOfMeasurements.map((unit) => (
                        <SelectItem value={unit.id.toString()} key={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.unitOfMeasurement && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.unitOfMeasurement}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <Label className={labelClasses} htmlFor="itemCategory">
                      Item Category
                    </Label>
                    <div
                      // onClick={showShowCategoriesModal}
                      className="text-xs flex items-center text-[#7047EB] underline underline-offset-2 cursor-pointer"
                    >
                      <Plus className="w-3" /> Add
                    </div>
                  </div>
                  <Select name="itemCategory">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemCategories.map((category) => (
                        <SelectItem
                          value={String(category.id)}
                          key={category.id}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.itemCategory && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.itemCategory}
                    </p>
                  )}
                </div>
              </div>

              {/* Current Stock and Default Price */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="currentStock">
                    Current Stock
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="currentStock"
                    id="currentStock"
                    type="number"
                    step="1"
                    min="0"
                    pattern="\d*"
                    inputMode="numeric"
                  />
                  {formErrors.currentStock && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.currentStock}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className={labelClasses} htmlFor="defaultPrice">
                      Default Price
                    </Label>
                    <div
                      onClick={() => setIsAdditionalPricesModalOpen(true)}
                      className="text-xs flex items-center text-[#7047EB] underline underline-offset-2 cursor-pointer"
                    >
                      <Plus className="text-[#7047EB] w-4 h-4 mr-1" />
                      Add Fields
                    </div>
                  </div>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="defaultPrice"
                    id="defaultPrice"
                    type="number"
                    step="1"
                    min="0"
                    pattern="\d*"
                    inputMode="numeric"
                  />
                  {formErrors.defaultPrice && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.defaultPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* HSN Code and Tax */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="hsnCode">
                    HSN Code
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="hsnCode"
                    id="hsnCode"
                  />
                  {formErrors.hsnCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.hsnCode}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="Tax">
                    Tax
                  </Label>
                  <Select name="tax">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTypes.map((tax) => (
                        <SelectItem value={String(tax.id)} key={tax.id}>
                          {tax.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.tax && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.tax}
                    </p>
                  )}
                </div>
              </div>

              {/* Warehouse */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className={labelClasses} htmlFor="warehouse">
                      Warehouse
                      <span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <div
                      // onClick={showAddWarehouseModal}
                      className="text-xs flex items-center text-[#7047EB] underline underline-offset-2 cursor-pointer"
                    >
                      <Plus className="w-3" /> Add
                    </div>
                  </div>
                  <Select name="warehouse">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          value={String(warehouse.id)}
                          key={warehouse.id}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.warehouse && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.warehouse}
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Levels */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="minimumStockLevel">
                    Minimum Stock Level
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="minimumStockLevel"
                    id="minimumStockLevel"
                    type="number"
                    step="1"
                    min="0"
                    pattern="\d*"
                    inputMode="numeric"
                  />
                  {formErrors.minimumStockLevel && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.minimumStockLevel}
                    </p>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <Label className={labelClasses} htmlFor="maximumStockLevel">
                    Maximum Stock Level
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} border border-neutral-200`}
                    name="maximumStockLevel"
                    id="maximumStockLevel"
                    type="number"
                    step="1"
                    min="0"
                    pattern="\d*"
                    inputMode="numeric"
                  />
                  {formErrors.maximumStockLevel && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.maximumStockLevel}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Additional Prices Modal */}
      {/* <AdditionalPricesModal
        isOpen={isAdditionalPricesModalOpen}
        onClose={() => setIsAdditionalPricesModalOpen(false)}
        onSave={handleAdditionalPricesSave}
        initialPrices={additionalPrices}
      /> */}
    </>
  );
};

export default AddPurchaseItemModal;

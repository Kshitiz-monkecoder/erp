import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  Ruler,
  Truck,
  Info,
  Trash2,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import SuccessToast from "../toasts/SuccessToast";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import AdditionalPricesModal from "./AdditionalPricesModal";
import { get, post } from "../../../lib/apiService";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};

type TaxType = {
  id: number;
  name: string;
  rate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Vendor = {
  id: number;
  name: string;
  clientType: string;
};

interface AdditionalPrices {
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
}

// ── Vendor lead time row ──────────────────────────────────────────────────────

interface VendorLeadTimeRow {
  id: string;
  vendorId: string;
  leadTimeDays: string;
  isDefault: boolean;
  lastDeliveryDate: string;
}

// ─── Interface ────────────────────────────────────────────────────────────────

interface IAddInventoryItemModal extends IModalProps {
  showAddUnitOfMeasurementModal: () => void;
  showAddWarehouseModal: () => void;
  showShowCategoriesModal: () => void;
  currentItemNo: number;
  isAnyModalOpen: boolean;
  onItemAdded?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 8);

// ─── Collapsible Section ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

const CollapsibleSection: React.FC<SectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#7047EB]">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {badge !== undefined && (
            <span className="bg-[#7047EB]/10 text-[#7047EB] text-xs font-medium px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 py-4 space-y-3 bg-white">{children}</div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AddInventoryItemModal: React.FC<IAddInventoryItemModal> = ({
  isOpen,
  onClose,
  showAddUnitOfMeasurementModal,
  showAddWarehouseModal,
  showShowCategoriesModal,
  currentItemNo,
  isAnyModalOpen,
  onItemAdded,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // ── Core data ───────────────────────────────────────────────────────────────
  const [unitOfMeasurements, setUnitOfMeasurements] = useState<Unit[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Additional Prices ───────────────────────────────────────────────────────
  const [isAdditionalPricesModalOpen, setIsAdditionalPricesModalOpen] =
    useState(false);
  const [additionalPrices, setAdditionalPrices] = useState<AdditionalPrices>({
    regularBuyingPrice: 0,
    regularSellingPrice: 0,
    wholesaleBuyingPrice: 0,
    mrp: 0,
    dealerPrice: 0,
    distributorPrice: 0,
  });

  // ── Weighted Average Price ──────────────────────────────────────────────────
  const [currentStock, setCurrentStock] = useState<string>("");
  const [defaultPrice, setDefaultPrice] = useState<string>("");
  // const weightedAvgPrice =
  //   currentStock && defaultPrice && Number(currentStock) > 0
  //     ? (
  //         (Number(currentStock) * Number(defaultPrice)) /
  //         Number(currentStock)
  //       ).toFixed(2)
  //     : "0.00";

  // ── Specifications ──────────────────────────────────────────────────────────
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [dimensionUnit, setDimensionUnit] = useState("cm");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [material, setMaterial] = useState("");
  const [technicalAttributes, setTechnicalAttributes] = useState("");
  const [isFifo, setIsFifo] = useState(true);

  // ── Vendor Lead Times ───────────────────────────────────────────────────────
  const [vendorLeadTimes, setVendorLeadTimes] = useState<VendorLeadTimeRow[]>([
    { id: genId(), vendorId: "", leadTimeDays: "", isDefault: true, lastDeliveryDate: "" },
  ]);

  const addVendorRow = () =>
    setVendorLeadTimes((v) => [
      ...v,
      { id: genId(), vendorId: "", leadTimeDays: "", isDefault: false, lastDeliveryDate: "" },
    ]);

  const removeVendorRow = (id: string) =>
    setVendorLeadTimes((v) => v.filter((r) => r.id !== id));

  const updateVendorRow = (
    id: string,
    field: keyof Omit<VendorLeadTimeRow, "id">,
    val: string | boolean
  ) =>
    setVendorLeadTimes((v) =>
      v.map((r) => {
        if (r.id !== id) return r;
        // If setting this row as default, clear others
        if (field === "isDefault" && val === true) {
          return { ...r, isDefault: true };
        }
        return { ...r, [field]: val };
      })
    );

  const setDefaultVendor = (id: string) =>
    setVendorLeadTimes((v) =>
      v.map((r) => ({ ...r, isDefault: r.id === id }))
    );

  // ── Outside click ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isSelectComponent =
        target.closest('[role="combobox"]') ||
        target.closest('[role="listbox"]') ||
        target.closest("[data-radix-popper-content-wrapper]");
      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        !isSelectComponent &&
        !isAnyModalOpen &&
        !isAdditionalPricesModalOpen
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, isAnyModalOpen, isAdditionalPricesModalOpen]);

  // ── Data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [units, cats, whs, taxes, clients] = await Promise.all([
          get("/inventory/unit"),
          get("/inventory/categories"),
          get("/inventory/warehouse"),
          get("/superadmin/tax"),
          get("/client"),
        ]);
        setUnitOfMeasurements(units.data as Unit[]);
        setItemCategories(cats.data as ItemCategory[]);
        setWarehouses(whs.data as Warehouse[]);
        setTaxTypes(taxes.data as TaxType[]);

        // Extract and filter vendors (Supplier or Both)
        let clientList: any[] = [];
        if (clients?.data?.list && Array.isArray(clients.data.list)) {
          clientList = clients.data.list;
        } else if (Array.isArray(clients?.data)) {
          clientList = clients.data;
        }
        const filteredVendors = clientList
          .filter(
            (c: any) =>
              c.clientType === "Supplier" || c.clientType === "Both"
          )
          .map((c: any) => ({ id: c.id, name: c.name, clientType: c.clientType }));
        setVendors(filteredVendors);
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFormErrors({});

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const newErrors: Record<string, string> = {};

    if (!formData.get("itemId")) newErrors.itemId = "Item ID is required.";
    if (!formData.get("itemName")) newErrors.itemName = "Item Name is required.";
    if (!formData.get("productServices"))
      newErrors.productServices = "Select Product or Service.";
    if (!formData.get("buySellBoth"))
      newErrors.buySellBoth = "Please choose an option.";
    if (!formData.get("unitOfMeasurement"))
      newErrors.unitOfMeasurement = "Unit of Measurement is required.";
    if (!formData.get("warehouse")) newErrors.warehouse = "Warehouse is required.";
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

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    // Build dimensions string like "10cm x 20cm x 30cm"
    const dimString =
      dimensions.length && dimensions.width && dimensions.height
        ? `${dimensions.length}${dimensionUnit} x ${dimensions.width}${dimensionUnit} x ${dimensions.height}${dimensionUnit}`
        : "";

    const payload = {
      sku: formData.get("itemId") as string,
      name: formData.get("itemName") as string,
      isProduct: formData.get("productServices") === "product",
      type: formData.get("buySellBoth") as string,
      unit: Number(formData.get("unitOfMeasurement")),
      category: formData.get("itemCategory"),
      currentStock: Number(formData.get("currentStock")),
      warehouse: formData.get("warehouse"),
      defaultPrice: Number(formData.get("defaultPrice")),
      hsnCode: formData.get("hsnCode") as string,
      tax: Number(formData.get("tax")) || 0,
      minimumStockLevel: Number(formData.get("minimumStockLevel")),
      maximumStockLevel: Number(formData.get("maximumStockLevel")),
      ...additionalPrices,
      // Specification fields (flat, matching API payload)
      isFifo,
      dimensions: dimString,
      dimensionUnit,
      weight: weight ? Number(weight) : undefined,
      weightUnit,
      material: material || undefined,
      technicalAttributes: technicalAttributes || undefined,
      status: "pending",
      // Vendor lead times — only include rows that have a vendor selected
      vendorLeadTimes: vendorLeadTimes
        .filter((r) => r.vendorId)
        .map((r) => ({
          vendorId: Number(r.vendorId),
          leadTimeDays: Number(r.leadTimeDays) || 0,
          isDefault: r.isDefault,
          lastDeliveryDate: r.lastDeliveryDate || undefined,
        })),
    };

    try {
      const result = await post("/inventory/item", payload);
      console.log("Item created:", result);
      SuccessToast({ title: "Item has been added successfully.", description: "" });
      onItemAdded?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-end z-50">
        <div
          className="bg-white w-full max-w-xl animate-in fade-in duration-200 flex flex-col"
          ref={modalRef}
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between gap-3 flex-shrink-0">
              <h3 className="sm:text-lg font-semibold">Item Details</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
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

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* ── Form Body ───────────────────────────────────────────── */}
            <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1">
              {/* ══ SECTION 1: Basic Info ══════════════════════════════════ */}
              <CollapsibleSection
                title="Basic Information"
                icon={<Package className="w-4 h-4" />}
                defaultOpen
              >
                {/* Item ID + Item Name */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses} htmlFor="itemId">
                      Item ID <span className="text-[#F53D6B]">*</span>
                    </Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="itemId"
                      id="itemId"
                      defaultValue={`ITEM-00${currentItemNo}`}
                    />
                    {formErrors.itemId && (
                      <p className="text-red-500 text-xs">{formErrors.itemId}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses} htmlFor="itemName">
                      Item Name <span className="text-[#F53D6B]">*</span>
                    </Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="itemName"
                      id="itemName"
                    />
                    {formErrors.itemName && (
                      <p className="text-red-500 text-xs">{formErrors.itemName}</p>
                    )}
                  </div>
                </div>

                {/* Product/Service + Buy/Sell/Both */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>
                      Product/Services <span className="text-[#F53D6B]">*</span>
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
                      <p className="text-red-500 text-xs">{formErrors.productServices}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>
                      Buy/Sell/Both <span className="text-[#F53D6B]">*</span>
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
                      <p className="text-red-500 text-xs">{formErrors.buySellBoth}</p>
                    )}
                  </div>
                </div>

                {/* UoM + Category */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className={labelClasses}>
                        Unit of Measurement <span className="text-[#F53D6B]">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={showAddUnitOfMeasurementModal}
                        className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                      >
                        <Plus className="w-3" /> Add
                      </button>
                    </div>
                    <Select name="unitOfMeasurement">
                      <SelectTrigger className={`${inputClasses} w-full`}>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOfMeasurements.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.unitOfMeasurement && (
                      <p className="text-red-500 text-xs">{formErrors.unitOfMeasurement}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className={labelClasses}>Item Category</Label>
                      <button
                        type="button"
                        onClick={showShowCategoriesModal}
                        className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                      >
                        <Plus className="w-3" /> Add
                      </button>
                    </div>
                    <Select name="itemCategory">
                      <SelectTrigger className={`${inputClasses} w-full`}>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemCategories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.itemCategory && (
                      <p className="text-red-500 text-xs">{formErrors.itemCategory}</p>
                    )}
                  </div>
                </div>

                {/* Current Stock + Default Price */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Current Stock</Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="currentStock"
                      type="number"
                      step="1"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                    />
                    {formErrors.currentStock && (
                      <p className="text-red-500 text-xs">{formErrors.currentStock}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className={labelClasses}>Default Price</Label>
                      <button
                        type="button"
                        onClick={() => setIsAdditionalPricesModalOpen(true)}
                        className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Fields
                      </button>
                    </div>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="defaultPrice"
                      type="number"
                      step="1"
                      min="0"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                    />
                    {formErrors.defaultPrice && (
                      <p className="text-red-500 text-xs">{formErrors.defaultPrice}</p>
                    )}
                  </div>
                </div>

                {/* Weighted Average Price */}
                {/* <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Weighted Average Price
                      </p>
                      <p className="text-xl font-bold text-purple-800 mt-1">
                        ₹ {weightedAvgPrice}
                      </p>
                      <p className="text-xs text-purple-500 mt-1">
                        Auto-updated after each GRN
                      </p>
                    </div>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-purple-400 cursor-help" />
                      <div className="hidden group-hover:block absolute right-0 top-5 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-lg">
                        <p className="font-semibold mb-1">Formula:</p>
                        <p className="font-mono text-purple-200">
                          ((Old Stock × Old Rate) + (New Stock × New Rate)) / Total Stock
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* HSN + Tax */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>HSN Code</Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="hsnCode"
                    />
                    {formErrors.hsnCode && (
                      <p className="text-red-500 text-xs">{formErrors.hsnCode}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Tax</Label>
                    <Select name="tax">
                      <SelectTrigger className={`${inputClasses} w-full`}>
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxTypes.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.tax && (
                      <p className="text-red-500 text-xs">{formErrors.tax}</p>
                    )}
                  </div>
                </div>

                {/* Warehouse */}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className={labelClasses}>
                      Warehouse <span className="text-[#F53D6B]">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={showAddWarehouseModal}
                      className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                    >
                      <Plus className="w-3" /> Add
                    </button>
                  </div>
                  <Select name="warehouse">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.warehouse && (
                    <p className="text-red-500 text-xs">{formErrors.warehouse}</p>
                  )}
                </div>

                {/* Stock Levels */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Minimum Stock Level</Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="minimumStockLevel"
                      type="number"
                      step="1"
                      min="0"
                    />
                    {formErrors.minimumStockLevel && (
                      <p className="text-red-500 text-xs">{formErrors.minimumStockLevel}</p>
                    )}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>
                      Maximum Stock Level <span className="text-[#F53D6B]">*</span>
                    </Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="maximumStockLevel"
                      type="number"
                      step="1"
                      min="0"
                    />
                    {formErrors.maximumStockLevel && (
                      <p className="text-red-500 text-xs">{formErrors.maximumStockLevel}</p>
                    )}
                  </div>
                </div>

                {/* FIFO Toggle */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFifo((v) => !v)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isFifo ? "bg-[#7047EB]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        isFifo ? "translate-x-4" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <Label className={`${labelClasses} cursor-pointer`}>
                    FIFO (First In, First Out)
                  </Label>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    <div className="hidden group-hover:block absolute left-0 top-5 w-56 bg-gray-800 text-white text-xs rounded-lg p-2.5 z-10 shadow-lg">
                      When enabled, the oldest stock is consumed first during transactions.
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* ══ SECTION 2: Specifications ══════════════════════════════ */}
              <CollapsibleSection
                title="Specifications"
                icon={<Ruler className="w-4 h-4" />}
              >
                {/* Dimensions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className={labelClasses}>Dimensions (L × W × H)</Label>
                    <select
                      value={dimensionUnit}
                      onChange={(e) => setDimensionUnit(e.target.value)}
                      className="border border-neutral-200 rounded-md px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB]"
                    >
                      <option value="cm">cm</option>
                      <option value="mm">mm</option>
                      <option value="in">in</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Length"
                      className={`${inputClasses} border border-neutral-200 text-sm flex-1`}
                      value={dimensions.length}
                      onChange={(e) =>
                        setDimensions((d) => ({ ...d, length: e.target.value }))
                      }
                    />
                    <span className="text-gray-400 font-bold">×</span>
                    <Input
                      placeholder="Width"
                      className={`${inputClasses} border border-neutral-200 text-sm flex-1`}
                      value={dimensions.width}
                      onChange={(e) =>
                        setDimensions((d) => ({ ...d, width: e.target.value }))
                      }
                    />
                    <span className="text-gray-400 font-bold">×</span>
                    <Input
                      placeholder="Height"
                      className={`${inputClasses} border border-neutral-200 text-sm flex-1`}
                      value={dimensions.height}
                      onChange={(e) =>
                        setDimensions((d) => ({ ...d, height: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Weight */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className={labelClasses}>Weight</Label>
                    <Input
                      placeholder="e.g. 2.5"
                      className={`${inputClasses} border border-neutral-200`}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={weightUnit}
                      onChange={(e) => setWeightUnit(e.target.value)}
                      className="w-full border border-neutral-200 rounded-md px-2 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB]"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                {/* Material */}
                <div className="space-y-1">
                  <Label className={labelClasses}>Material</Label>
                  <Input
                    placeholder="e.g. Stainless Steel, ABS Plastic"
                    className={`${inputClasses} border border-neutral-200`}
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                  />
                </div>

                {/* Technical Attributes */}
                <div className="space-y-1">
                  <Label className={labelClasses}>Technical Attributes</Label>
                  <textarea
                    placeholder="e.g. Heat resistant, corrosion resistant, 220V compatible"
                    rows={3}
                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB] resize-none"
                    value={technicalAttributes}
                    onChange={(e) => setTechnicalAttributes(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Comma-separated list of technical properties
                  </p>
                </div>
              </CollapsibleSection>

              {/* ══ SECTION 3: Vendor Lead Time ══════════════════════════════ */}
              <CollapsibleSection
                title="Vendor Lead Times"
                icon={<Truck className="w-4 h-4" />}
                badge={
                  vendorLeadTimes.filter((r) => r.vendorId).length || undefined
                }
              >
                <p className="text-xs text-gray-400 -mt-1 mb-2">
                  Link vendors and their expected lead times for this item.
                </p>

                {vendors.length === 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                    No vendors found. Add a supplier-type client first to link vendor lead times.
                  </div>
                )}

                <div className="space-y-3">
                  {vendorLeadTimes.map((row, idx) => (
                    <div
                      key={row.id}
                      className="border border-neutral-200 rounded-lg p-3 space-y-3 bg-gray-50/50"
                    >
                      {/* Row header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Vendor {idx + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          {/* Default badge / toggle */}
                          <button
                            type="button"
                            onClick={() => setDefaultVendor(row.id)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              row.isDefault
                                ? "bg-[#7047EB]/10 border-[#7047EB]/30 text-[#7047EB] font-medium"
                                : "border-gray-200 text-gray-400 hover:border-[#7047EB]/30 hover:text-[#7047EB]"
                            }`}
                          >
                            {row.isDefault ? "✓ Default" : "Set Default"}
                          </button>
                          {vendorLeadTimes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVendorRow(row.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Vendor dropdown + Lead time */}
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className={labelClasses}>Vendor / Supplier</Label>
                          <select
                            value={row.vendorId}
                            onChange={(e) =>
                              updateVendorRow(row.id, "vendorId", e.target.value)
                            }
                            className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB] bg-white"
                          >
                            <option value="">Select vendor...</option>
                            {vendors.map((v) => (
                              <option
                                key={v.id}
                                value={String(v.id)}
                                disabled={
                                  // Prevent selecting same vendor twice
                                  vendorLeadTimes.some(
                                    (r) => r.id !== row.id && r.vendorId === String(v.id)
                                  )
                                }
                              >
                                {v.name}{" "}
                                {v.clientType === "Both" ? "(Buyer & Supplier)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className={labelClasses}>Lead Time (Days)</Label>
                          <Input
                            placeholder="e.g. 7"
                            type="number"
                            min="0"
                            className={`${inputClasses} border border-neutral-200 text-sm`}
                            value={row.leadTimeDays}
                            onChange={(e) =>
                              updateVendorRow(row.id, "leadTimeDays", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Last Delivery Date */}
                      <div className="space-y-1">
                        <Label className={labelClasses}>Last Delivery Date</Label>
                        <Input
                          type="date"
                          className={`${inputClasses} border border-neutral-200 text-sm`}
                          value={row.lastDeliveryDate}
                          onChange={(e) =>
                            updateVendorRow(row.id, "lastDeliveryDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addVendorRow}
                  disabled={vendors.length === 0}
                  className="w-full mt-1 py-2 border border-dashed border-[#7047EB]/40 rounded-lg text-sm text-[#7047EB] hover:bg-[#7047EB]/5 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Vendor
                </button>
              </CollapsibleSection>
            </div>
          </form>
        </div>
      </div>

      {/* Additional Prices Modal */}
      <AdditionalPricesModal
        isOpen={isAdditionalPricesModalOpen}
        onClose={() => setIsAdditionalPricesModalOpen(false)}
        onSave={(prices) => setAdditionalPrices(prices)}
        initialPrices={additionalPrices}
      />
    </>
  );
};

export default AddInventoryItemModal;
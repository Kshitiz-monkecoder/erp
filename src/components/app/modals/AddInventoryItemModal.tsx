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
  Paperclip,
  X,
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

interface AdditionalPrices {
  regularBuyingPrice: number;
  regularSellingPrice: number;
  wholesaleBuyingPrice: number;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
}

// ── Specification types ───────────────────────────────────────────────────────

interface TechAttribute {
  id: string;
  key: string;
  value: string;
}

interface Specifications {
  length: string;
  width: string;
  height: string;
  weight: string;
  weightUnit: string;
  material: string;
  techAttributes: TechAttribute[];
  customNotes: string;
}

// ── Vendor lead time types ────────────────────────────────────────────────────

interface DeliveryRecord {
  id: string;
  orderedDate: string;
  deliveredDate: string;
  days: number;
}

interface VendorLeadTime {
  vendorName: string;
  leadTimeDays: string;
  deliveryHistory: DeliveryRecord[];
}

// ── Attachment types ──────────────────────────────────────────────────────────

type AttachmentCategory = "product_image" | "technical_doc" | "compliance_cert" | "specification_sheet";

interface Attachment {
  id: string;
  file: File;
  category: AttachmentCategory;
  preview?: string;
}

const ATTACHMENT_CATEGORIES: { value: AttachmentCategory; label: string }[] = [
  { value: "product_image", label: "Product Image" },
  { value: "technical_doc", label: "Technical Document" },
  { value: "compliance_cert", label: "Compliance Certificate" },
  { value: "specification_sheet", label: "Specification Sheet" },
];

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

const calcAvgLeadTime = (history: DeliveryRecord[]) => {
  if (history.length === 0) return null;
  const sum = history.reduce((acc, r) => acc + r.days, 0);
  return (sum / history.length).toFixed(1);
};

const calcDaysBetween = (start: string, end: string) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(diff / 86400000));
};

const getEstimatedDeliveryDate = (avgDays: string | null) => {
  if (!avgDays) return null;
  const d = new Date();
  d.setDate(d.getDate() + Math.round(Number(avgDays)));
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Collapsible Section ──────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false, badge }) => {
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
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 py-4 space-y-3 bg-white">{children}</div>}
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
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Additional Prices ───────────────────────────────────────────────────────
  const [isAdditionalPricesModalOpen, setIsAdditionalPricesModalOpen] = useState(false);
  const [additionalPrices, setAdditionalPrices] = useState<AdditionalPrices>({
    regularBuyingPrice: 0,
    regularSellingPrice: 0,
    wholesaleBuyingPrice: 0,
    mrp: 0,
    dealerPrice: 0,
    distributorPrice: 0,
  });

  // ── Weighted Average Price (display only on create — will be 0 for new items) ──
  // Formula shown to user for transparency
  const [currentStock, setCurrentStock] = useState<string>("");
  const [defaultPrice, setDefaultPrice] = useState<string>("");
  const weightedAvgPrice =
    currentStock && defaultPrice && Number(currentStock) > 0
      ? ((Number(currentStock) * Number(defaultPrice)) / Number(currentStock)).toFixed(2)
      : "0.00";

  // ── Specifications ──────────────────────────────────────────────────────────
  const [specs, setSpecs] = useState<Specifications>({
    length: "", width: "", height: "", weight: "", weightUnit: "kg",
    material: "", techAttributes: [], customNotes: "",
  });

  const addTechAttr = () =>
    setSpecs((s) => ({ ...s, techAttributes: [...s.techAttributes, { id: genId(), key: "", value: "" }] }));

  const updateTechAttr = (id: string, field: "key" | "value", val: string) =>
    setSpecs((s) => ({
      ...s,
      techAttributes: s.techAttributes.map((a) => (a.id === id ? { ...a, [field]: val } : a)),
    }));

  const removeTechAttr = (id: string) =>
    setSpecs((s) => ({ ...s, techAttributes: s.techAttributes.filter((a) => a.id !== id) }));

  // ── Vendor Lead Time ────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<VendorLeadTime[]>([
    { vendorName: "", leadTimeDays: "", deliveryHistory: [] },
  ]);

  const addVendor = () =>
    setVendors((v) => [...v, { vendorName: "", leadTimeDays: "", deliveryHistory: [] }]);

  const removeVendor = (idx: number) =>
    setVendors((v) => v.filter((_, i) => i !== idx));

  const updateVendor = (idx: number, field: keyof Omit<VendorLeadTime, "deliveryHistory">, val: string) =>
    setVendors((v) => v.map((vdr, i) => (i === idx ? { ...vdr, [field]: val } : vdr)));

  const addDeliveryRecord = (vIdx: number) =>
    setVendors((v) =>
      v.map((vdr, i) =>
        i === vIdx
          ? {
              ...vdr,
              deliveryHistory: [
                ...vdr.deliveryHistory.slice(-4), // keep max 5
                { id: genId(), orderedDate: "", deliveredDate: "", days: 0 },
              ],
            }
          : vdr
      )
    );

  const updateDeliveryRecord = (vIdx: number, rId: string, field: keyof DeliveryRecord, val: string) =>
    setVendors((v) =>
      v.map((vdr, i) => {
        if (i !== vIdx) return vdr;
        const history = vdr.deliveryHistory.map((r) => {
          if (r.id !== rId) return r;
          const updated = { ...r, [field]: val };
          if (field === "orderedDate" || field === "deliveredDate") {
            updated.days = calcDaysBetween(
              field === "orderedDate" ? val : r.orderedDate,
              field === "deliveredDate" ? val : r.deliveredDate
            );
          }
          return updated;
        });
        return { ...vdr, deliveryHistory: history };
      })
    );

  const removeDeliveryRecord = (vIdx: number, rId: string) =>
    setVendors((v) =>
      v.map((vdr, i) =>
        i === vIdx ? { ...vdr, deliveryHistory: vdr.deliveryHistory.filter((r) => r.id !== rId) } : vdr
      )
    );

  // ── Attachments ─────────────────────────────────────────────────────────────
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCategory, setPendingCategory] = useState<AttachmentCategory>("product_image");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = files.map((file) => {
      const att: Attachment = { id: genId(), file, category: pendingCategory };
      if (file.type.startsWith("image/")) {
        att.preview = URL.createObjectURL(file);
      }
      return att;
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    const att = attachments.find((a) => a.id === id);
    if (att?.preview) URL.revokeObjectURL(att.preview);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

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
        const [units, cats, whs, taxes] = await Promise.all([
          get("/inventory/unit"),
          get("/inventory/categories"),
          get("/inventory/warehouse"),
          get("/superadmin/tax"),
        ]);
        setUnitOfMeasurements(units.data as Unit[]);
        setItemCategories(cats.data as ItemCategory[]);
        setWarehouses(whs.data as Warehouse[]);
        setTaxTypes(taxes.data as TaxType[]);
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
    if (!formData.get("productServices")) newErrors.productServices = "Select Product or Service.";
    if (!formData.get("buySellBoth")) newErrors.buySellBoth = "Please choose an option.";
    if (!formData.get("unitOfMeasurement")) newErrors.unitOfMeasurement = "Unit of Measurement is required.";
    if (!formData.get("warehouse")) newErrors.warehouse = "Warehouse is required.";
    if (!formData.get("maximumStockLevel")) newErrors.maximumStockLevel = "Max stock level is required.";
    if (!formData.get("minimumStockLevel")) newErrors.minimumStockLevel = "Min stock level is required.";
    if (!formData.get("hsnCode")) newErrors.hsnCode = "HSN Code is required.";
    if (!formData.get("itemCategory")) newErrors.itemCategory = "Item Category is required.";
    if (!formData.get("currentStock")) newErrors.currentStock = "Current stock is required.";
    if (!formData.get("defaultPrice")) newErrors.defaultPrice = "Default price is required.";
    if (!formData.get("tax")) newErrors.tax = "Tax is required.";

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
      tax: Number(formData.get("tax")) || 0,
      minimumStockLevel: Number(formData.get("minimumStockLevel")),
      maximumStockLevel: Number(formData.get("maximumStockLevel")),
      ...additionalPrices,
      warehouse: formData.get("warehouse"),
      // New fields
      specifications: {
        dimensions: { length: specs.length, width: specs.width, height: specs.height },
        weight: specs.weight,
        weightUnit: specs.weightUnit,
        material: specs.material,
        techAttributes: specs.techAttributes,
        customNotes: specs.customNotes,
      },
      vendorLeadTimes: vendors
        .filter((v) => v.vendorName)
        .map((v) => ({
          vendorName: v.vendorName,
          leadTimeDays: Number(v.leadTimeDays),
          deliveryHistory: v.deliveryHistory,
          avgLeadTime: calcAvgLeadTime(v.deliveryHistory),
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
        <div className="bg-white w-full max-w-xl animate-in fade-in duration-200 flex flex-col" ref={modalRef}>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="sm:text-lg font-semibold">Item Details</h3>
              </div>
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
                    <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</>
                  ) : "Save"}
                </Button>
              </div>
            </div>

            {/* ── Error ─────────────────────────────────────────────────── */}
            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* ── Form Body ─────────────────────────────────────────────── */}
            <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1">

              {/* ══ SECTION 1: Basic Info ═══════════════════════════════════ */}
              <CollapsibleSection title="Basic Information" icon={<Package className="w-4 h-4" />} defaultOpen>

                {/* Item ID + Item Name */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses} htmlFor="itemId">Item ID <span className="text-[#F53D6B]">*</span></Label>
                    <Input className={`${inputClasses} border border-neutral-200`} name="itemId" id="itemId" defaultValue={`ITEM-00${currentItemNo}`} />
                    {formErrors.itemId && <p className="text-red-500 text-xs">{formErrors.itemId}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses} htmlFor="itemName">Item Name <span className="text-[#F53D6B]">*</span></Label>
                    <Input className={`${inputClasses} border border-neutral-200`} name="itemName" id="itemName" />
                    {formErrors.itemName && <p className="text-red-500 text-xs">{formErrors.itemName}</p>}
                  </div>
                </div>

                {/* Product/Service + Buy/Sell/Both */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Product/Services <span className="text-[#F53D6B]">*</span></Label>
                    <Select name="productServices" defaultValue="product">
                      <SelectTrigger className={`${inputClasses} w-full`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.productServices && <p className="text-red-500 text-xs">{formErrors.productServices}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Buy/Sell/Both <span className="text-[#F53D6B]">*</span></Label>
                    <Select name="buySellBoth">
                      <SelectTrigger className={`${inputClasses} w-full`}><SelectValue placeholder="" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buyer">Buyer</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.buySellBoth && <p className="text-red-500 text-xs">{formErrors.buySellBoth}</p>}
                  </div>
                </div>

                {/* UoM + Category */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className={labelClasses}>Unit of Measurement <span className="text-[#F53D6B]">*</span></Label>
                      <button type="button" onClick={showAddUnitOfMeasurementModal} className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"><Plus className="w-3" /> Add</button>
                    </div>
                    <Select name="unitOfMeasurement">
                      <SelectTrigger className={`${inputClasses} w-full`}><SelectValue placeholder="" /></SelectTrigger>
                      <SelectContent>
                        {unitOfMeasurements.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formErrors.unitOfMeasurement && <p className="text-red-500 text-xs">{formErrors.unitOfMeasurement}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center">
                      <Label className={labelClasses}>Item Category</Label>
                      <button type="button" onClick={showShowCategoriesModal} className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"><Plus className="w-3" /> Add</button>
                    </div>
                    <Select name="itemCategory">
                      <SelectTrigger className={`${inputClasses} w-full`}><SelectValue placeholder="" /></SelectTrigger>
                      <SelectContent>
                        {itemCategories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formErrors.itemCategory && <p className="text-red-500 text-xs">{formErrors.itemCategory}</p>}
                  </div>
                </div>

                {/* Current Stock + Default Price + Weighted Avg */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Current Stock</Label>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="currentStock" type="number" step="1" min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                    />
                    {formErrors.currentStock && <p className="text-red-500 text-xs">{formErrors.currentStock}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className={labelClasses}>Default Price</Label>
                      <button type="button" onClick={() => setIsAdditionalPricesModalOpen(true)} className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"><Plus className="w-4 h-4 mr-1" />Add Fields</button>
                    </div>
                    <Input
                      className={`${inputClasses} border border-neutral-200`}
                      name="defaultPrice" type="number" step="1" min="0"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                    />
                    {formErrors.defaultPrice && <p className="text-red-500 text-xs">{formErrors.defaultPrice}</p>}
                  </div>
                </div>

                {/* Weighted Average Price */}
                <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Weighted Average Price</p>
                      <p className="text-xl font-bold text-purple-800 mt-1">₹ {weightedAvgPrice}</p>
                      <p className="text-xs text-purple-500 mt-1">Auto-updated after each GRN</p>
                    </div>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-purple-400 cursor-help" />
                      <div className="hidden group-hover:block absolute right-0 top-5 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 z-10 shadow-lg">
                        <p className="font-semibold mb-1">Formula:</p>
                        <p className="font-mono text-purple-200">((Old Stock × Old Rate) + (New Stock × New Rate)) / Total Stock</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* HSN + Tax */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>HSN Code</Label>
                    <Input className={`${inputClasses} border border-neutral-200`} name="hsnCode" />
                    {formErrors.hsnCode && <p className="text-red-500 text-xs">{formErrors.hsnCode}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Tax</Label>
                    <Select name="tax">
                      <SelectTrigger className={`${inputClasses} w-full`}><SelectValue placeholder="" /></SelectTrigger>
                      <SelectContent>
                        {taxTypes.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formErrors.tax && <p className="text-red-500 text-xs">{formErrors.tax}</p>}
                  </div>
                </div>

                {/* Warehouse */}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className={labelClasses}>Warehouse <span className="text-[#F53D6B]">*</span></Label>
                    <button type="button" onClick={showAddWarehouseModal} className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"><Plus className="w-3" /> Add</button>
                  </div>
                  <Select name="warehouse">
                    <SelectTrigger className={`${inputClasses} w-full`}><SelectValue placeholder="" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.warehouse && <p className="text-red-500 text-xs">{formErrors.warehouse}</p>}
                </div>

                {/* Stock Levels */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Minimum Stock Level</Label>
                    <Input className={`${inputClasses} border border-neutral-200`} name="minimumStockLevel" type="number" step="1" min="0" />
                    {formErrors.minimumStockLevel && <p className="text-red-500 text-xs">{formErrors.minimumStockLevel}</p>}
                  </div>
                  <div className="w-full space-y-1">
                    <Label className={labelClasses}>Maximum Stock Level <span className="text-[#F53D6B]">*</span></Label>
                    <Input className={`${inputClasses} border border-neutral-200`} name="maximumStockLevel" type="number" step="1" min="0" />
                    {formErrors.maximumStockLevel && <p className="text-red-500 text-xs">{formErrors.maximumStockLevel}</p>}
                  </div>
                </div>
              </CollapsibleSection>

              {/* ══ SECTION 2: Specifications ════════════════════════════════ */}
              <CollapsibleSection title="Specifications" icon={<Ruler className="w-4 h-4" />}>

                {/* Dimensions */}
                <div>
                  <Label className={`${labelClasses} mb-2 block`}>Dimensions (L × W × H)</Label>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder="Length"
                        className={`${inputClasses} border border-neutral-200 text-sm`}
                        value={specs.length}
                        onChange={(e) => setSpecs((s) => ({ ...s, length: e.target.value }))}
                      />
                    </div>
                    <span className="text-gray-400 font-bold">×</span>
                    <div className="flex-1">
                      <Input
                        placeholder="Width"
                        className={`${inputClasses} border border-neutral-200 text-sm`}
                        value={specs.width}
                        onChange={(e) => setSpecs((s) => ({ ...s, width: e.target.value }))}
                      />
                    </div>
                    <span className="text-gray-400 font-bold">×</span>
                    <div className="flex-1">
                      <Input
                        placeholder="Height"
                        className={`${inputClasses} border border-neutral-200 text-sm`}
                        value={specs.height}
                        onChange={(e) => setSpecs((s) => ({ ...s, height: e.target.value }))}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className={labelClasses}>Weight</Label>
                    <Input
                      placeholder="e.g. 2.5"
                      className={`${inputClasses} border border-neutral-200`}
                      value={specs.weight}
                      onChange={(e) => setSpecs((s) => ({ ...s, weight: e.target.value }))}
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={specs.weightUnit}
                      onChange={(e) => setSpecs((s) => ({ ...s, weightUnit: e.target.value }))}
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
                    value={specs.material}
                    onChange={(e) => setSpecs((s) => ({ ...s, material: e.target.value }))}
                  />
                </div>

                {/* Technical Attributes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className={labelClasses}>Technical Attributes</Label>
                    <button
                      type="button"
                      onClick={addTechAttr}
                      className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                    >
                      <Plus className="w-3" /> Add Attribute
                    </button>
                  </div>
                  {specs.techAttributes.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No attributes added. Click "+ Add Attribute" to add key-value pairs.</p>
                  )}
                  {specs.techAttributes.map((attr) => (
                    <div key={attr.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Attribute (e.g. Voltage)"
                        className={`${inputClasses} border border-neutral-200 flex-1 text-sm`}
                        value={attr.key}
                        onChange={(e) => updateTechAttr(attr.id, "key", e.target.value)}
                      />
                      <Input
                        placeholder="Value (e.g. 220V)"
                        className={`${inputClasses} border border-neutral-200 flex-1 text-sm`}
                        value={attr.value}
                        onChange={(e) => updateTechAttr(attr.id, "value", e.target.value)}
                      />
                      <button type="button" onClick={() => removeTechAttr(attr.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Custom Notes */}
                <div className="space-y-1">
                  <Label className={labelClasses}>Custom Specification Notes</Label>
                  <textarea
                    placeholder="Any additional specifications or notes..."
                    rows={3}
                    className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB] resize-none"
                    value={specs.customNotes}
                    onChange={(e) => setSpecs((s) => ({ ...s, customNotes: e.target.value }))}
                  />
                </div>
              </CollapsibleSection>

              {/* ══ SECTION 3: Vendor Lead Time ══════════════════════════════ */}
              <CollapsibleSection
                title="Vendor Lead Time"
                icon={<Truck className="w-4 h-4" />}
                badge={vendors.filter((v) => v.vendorName).length || undefined}
              >
                <p className="text-xs text-gray-400 -mt-1 mb-2">
                  Track delivery timelines per vendor to estimate purchase order delivery dates.
                </p>

                {vendors.map((vendor, vIdx) => {
                  const avg = calcAvgLeadTime(vendor.deliveryHistory);
                  const estDelivery = getEstimatedDeliveryDate(avg);
                  return (
                    <div key={vIdx} className="border border-neutral-200 rounded-lg p-3 space-y-3 bg-gray-50/50">
                      {/* Vendor header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Vendor {vIdx + 1}
                        </span>
                        {vendors.length > 1 && (
                          <button type="button" onClick={() => removeVendor(vIdx)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Vendor name + lead time */}
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className={labelClasses}>Vendor / Supplier Name</Label>
                          <Input
                            placeholder="e.g. ABC Suppliers"
                            className={`${inputClasses} border border-neutral-200 text-sm`}
                            value={vendor.vendorName}
                            onChange={(e) => updateVendor(vIdx, "vendorName", e.target.value)}
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className={labelClasses}>Lead Time (Days)</Label>
                          <Input
                            placeholder="e.g. 7"
                            type="number"
                            min="0"
                            className={`${inputClasses} border border-neutral-200 text-sm`}
                            value={vendor.leadTimeDays}
                            onChange={(e) => updateVendor(vIdx, "leadTimeDays", e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Average + Estimated Delivery */}
                      {avg && (
                        <div className="flex gap-3">
                          <div className="flex-1 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                            <p className="text-xs text-blue-500 font-medium">Avg Lead Time</p>
                            <p className="text-sm font-bold text-blue-700">{avg} days</p>
                          </div>
                          <div className="flex-1 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
                            <p className="text-xs text-emerald-500 font-medium">Est. Delivery (from today)</p>
                            <p className="text-sm font-bold text-emerald-700">{estDelivery}</p>
                          </div>
                        </div>
                      )}

                      {/* Delivery History (last 5) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className={`${labelClasses} text-xs`}>
                            Delivery History
                            <span className="text-gray-400 font-normal ml-1">(last 5)</span>
                          </Label>
                          {vendor.deliveryHistory.length < 5 && (
                            <button
                              type="button"
                              onClick={() => addDeliveryRecord(vIdx)}
                              className="text-xs flex items-center text-[#7047EB] underline cursor-pointer"
                            >
                              <Plus className="w-3" /> Add Entry
                            </button>
                          )}
                        </div>

                        {vendor.deliveryHistory.length === 0 && (
                          <p className="text-xs text-gray-400 italic">No delivery records yet.</p>
                        )}

                        {vendor.deliveryHistory.map((rec) => (
                          <div key={rec.id} className="flex gap-2 items-center mb-2">
                            <div className="flex-1 space-y-0.5">
                              <p className="text-xs text-gray-400">Order Date</p>
                              <Input
                                type="date"
                                className={`${inputClasses} border border-neutral-200 text-xs h-8`}
                                value={rec.orderedDate}
                                onChange={(e) => updateDeliveryRecord(vIdx, rec.id, "orderedDate", e.target.value)}
                              />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <p className="text-xs text-gray-400">Delivery Date</p>
                              <Input
                                type="date"
                                className={`${inputClasses} border border-neutral-200 text-xs h-8`}
                                value={rec.deliveredDate}
                                onChange={(e) => updateDeliveryRecord(vIdx, rec.id, "deliveredDate", e.target.value)}
                              />
                            </div>
                            <div className="w-16 space-y-0.5">
                              <p className="text-xs text-gray-400">Days</p>
                              <div className={`h-8 flex items-center justify-center rounded-md text-sm font-semibold border ${rec.days > 0 ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                                {rec.days || "-"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDeliveryRecord(vIdx, rec.id)}
                              className="text-gray-400 hover:text-red-500 mt-4"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addVendor}
                  className="w-full mt-1 py-2 border border-dashed border-[#7047EB]/40 rounded-lg text-sm text-[#7047EB] hover:bg-[#7047EB]/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Vendor
                </button>
              </CollapsibleSection>

              {/* ══ SECTION 4: Attachments ════════════════════════════════════ */}
              <CollapsibleSection
                title="Attachments"
                icon={<Paperclip className="w-4 h-4" />}
                badge={attachments.length || undefined}
              >
                {/* Upload control */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className={labelClasses}>Category</Label>
                    <select
                      value={pendingCategory}
                      onChange={(e) => setPendingCategory(e.target.value as AttachmentCategory)}
                      className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#7047EB]"
                    >
                      {ATTACHMENT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 border border-[#7047EB] text-[#7047EB] text-sm font-medium rounded-md hover:bg-[#7047EB]/5 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Upload File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Attachment list */}
                {attachments.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center justify-center text-gray-400">
                    <Paperclip className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">No files uploaded yet</p>
                    <p className="text-xs mt-0.5">Supports: Images, PDF, Word, Excel</p>
                  </div>
                )}

                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                      {/* Preview or icon */}
                      {att.preview ? (
                        <img src={att.preview} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Paperclip className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{att.file.name}</p>
                        <p className="text-xs text-gray-400">
                          {ATTACHMENT_CATEGORIES.find((c) => c.value === att.category)?.label} ·{" "}
                          {(att.file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
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
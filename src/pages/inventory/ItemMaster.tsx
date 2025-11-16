// src/pages/ItemMaster.tsx
import React, { useEffect, useRef, useState } from "react";
import UniversalTable from "@/components/app/tables";
import { InventoryItem } from "./types";
import { get, post } from "@/lib/apiService";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectFilter, { OptionType } from "@/components/app/SelectFilter";
import MultiSelectWithSearch from "@/components/app/MultiSelectWithSearch";
import AddInventoryItemModal from "@/components/app/modals/AddInventoryItemModal";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import SuccessToast from "@/components/app/toasts/SuccessToast"; // adjust path if needed



const productOptions: OptionType[] = [
  { label: "Products", value: "Product" },
  { label: "Service", value: "Service" },
];

const storeOptions: OptionType[] = [
  { label: "Default Stock Store", value: "Default Stock Store" },
  { label: "Default Reject Store", value: "Default Reject Store" },
];

const statusOptions: OptionType[] = [
  { label: "All", value: "all" },
  { label: "Low Stock", value: "low" },
  { label: "Excess Stock", value: "excess" },
  { label: "Negative Stock", value: "negative" },
  { label: "Inactive Items", value: "inactive" },
];

const ItemMaster: React.FC = () => {
  const [itemData, setItemData] = useState<Array<InventoryItem>>(new Array<InventoryItem>());
  const [loading, setLoading] = useState<boolean>(true);
  const [maxID, setMaxID] = useState<number>(0);

  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] = useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState<boolean>(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState<boolean>(false);
  const [showAddInventoryItemModal, setShowAddInventoryItemModal] = useState<boolean>(false);

  // Barcode modal state
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeModalItem, setBarcodeModalItem] = useState<{ itemId: string; itemName: string; id: number | null }>({
    itemId: "",
    itemName: "",
    id: null,
  });

  const [_refreshCategoriesTrigger, setRefreshCategoriesTrigger] = useState<number>(0);
  const [_refreshWarehouseTrigger, setRefreshWarehouseTrigger] = useState<number>(0);

  const toggleAddUnitOfMeasurementModal = () => setShowAddUnitOfMeasurementModal((prev) => !prev);
  const toggleAddInventoryItemModal = () => setShowAddInventoryItemModal((prev) => !prev);
  const toggleAddWarehouseModal = () => setShowAddWarehouseModal((prev) => !prev);
  const toggleAddCategoriesModal = () => setShowAddCategoriesModal((prev) => !prev);
  const handleRefreshCategoriesTable = () => setRefreshCategoriesTrigger((prev) => prev + 1);
  const handleRefreshWarehouseTable = () => setRefreshWarehouseTrigger((prev) => prev + 1);

  const navigateTo = useNavigate();

  useEffect(() => {
    fetchInventoryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await get("/inventory/item");
      if (!response) throw new Error("Invalid response from server");
      setItemData(response.data || []);
      setMaxID(
        (response.data || []).reduce((max: number, item: InventoryItem) => {
          return Math.max(max, (item.id as number) || 0);
        }, 0)
      );
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  // function to open barcode modal, used in table
  const openBarcodeModal = (row: InventoryItem) => {
    setBarcodeModalItem({ itemId: row.sku, itemName: row.name, id: row.id || null });
    setBarcodeModalOpen(true);
  };

  const columns: ColumnDef<InventoryItem>[] = [
    {
      header: "Item Id",
      accessorKey: "itemId",
      cell: ({ row }) => (
        <div
          onClick={() => {
            navigateTo(`/inventory/item-details/${row.original.id}`);
          }}
          className="font-normal text-blue-500 gap-2 min-w-56 flex items-center cursor-pointer"
        >
          {row.original.sku}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Item Name",
      accessorKey: "itemName",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.name}</div>,
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Item Category",
      accessorKey: "itemCategory",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.category?.name}</div>,
      filterFn: "equals",
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Unit",
      accessorKey: "unit",
      cell: ({ row }) => <div className="font-normal">{row.original.unit?.name}</div>,
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Default Price",
      accessorKey: "defaultPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.defaultPrice}</div>,
      meta: {
        filterVariant: "select",
      },
    },
    {
      header: "Regular Buying Price",
      accessorKey: "regularBuyingPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.regularBuyingPrice}</div>,
      meta: {
        filterVariant: "select",
      },
    },
    // Barcode column -> opens modal
    {
      header: "Barcode",
      id: "barcode",
      cell: ({ row }) => (
        <button
          className="text-blue-600 border px-3 py-1 rounded-md hover:bg-blue-50"
          onClick={() => openBarcodeModal(row.original)}
        >
          + Add Barcode
        </button>
      ),
    },
  ];

  return (
    <>
      <UniversalTable<InventoryItem>
        data={itemData}
        columns={columns}
        isLoading={loading}
        enableCreate={true}
        createButtonText="Add Item"
        onCreateClick={toggleAddInventoryItemModal}
        customFilterSection={(table) => (
          <>
            <SelectFilter
              label="Products/Services"
              items={productOptions}
              onValueChange={(value) => {
                table.getColumn("type")?.setFilterValue(value);
              }}
            />
            <SelectFilter
              label="Stores"
              items={storeOptions}
              onValueChange={() => {
                // implement if you add a store column
              }}
            />
            <SelectFilter
              label="Status"
              items={statusOptions}
              defaultValue={statusOptions[0].value}
              onValueChange={() => {}}
            />
            <MultiSelectWithSearch columns={table.getAllColumns()} label="Show/Hide Columns" />
          </>
        )}
      />

      <AddInventoryItemModal
        isAnyModalOpen={showAddCategoriesModal || showAddWarehouseModal || showAddUnitOfMeasurementModal}
        isOpen={showAddInventoryItemModal}
        onClose={toggleAddInventoryItemModal}
        showAddUnitOfMeasurementModal={toggleAddUnitOfMeasurementModal}
        showAddWarehouseModal={toggleAddWarehouseModal}
        showShowCategoriesModal={toggleAddCategoriesModal}
        currentItemNo={maxID + 1}
      />

      <AddUnitOfMeasurementModal isOpen={showAddUnitOfMeasurementModal} onClose={toggleAddUnitOfMeasurementModal} />

      <AddCategoriesModal isOpen={showAddCategoriesModal} onClose={toggleAddCategoriesModal} onSuccess={handleRefreshCategoriesTable} />

      <AddWarehouseModal isOpen={showAddWarehouseModal} onClose={toggleAddWarehouseModal} onSuccess={handleRefreshWarehouseTable} />

      {/* Barcode Modal - same sliding modal style as AddInventoryItemModal */}
      <BarcodeModal
        isOpen={barcodeModalOpen}
        onClose={() => {
          setBarcodeModalOpen(false);
          // optional: refresh items to update any stock changes
          fetchInventoryItems();
        }}
        itemId={barcodeModalItem.itemId}
        itemName={barcodeModalItem.itemName}
        internalItemId={barcodeModalItem.id}
      />
    </>
  );
};

export default ItemMaster;


interface IBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  internalItemId: number | null; // DB id (optional)
}

const BarcodeModal: React.FC<IBarcodeModalProps> = ({ isOpen, onClose, itemId, itemName, internalItemId }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [barcodeSeriesList, setBarcodeSeriesList] = useState<Array<{ id: number; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isSelectComponent =
        target.closest('[role="combobox"]') ||
        target.closest('[role="listbox"]') ||
        target.closest("[data-radix-popper-content-wrapper]");

      if (modalRef.current && !modalRef.current.contains(target) && !isSelectComponent) {
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

  useEffect(() => {
    if (!isOpen) return;
    const fetchSeries = async () => {
      try {
        const resp = await get("/inventory/barcode-series");
        if (resp && Array.isArray(resp.data)) {
          setBarcodeSeriesList(resp.data);
        } else {
          setBarcodeSeriesList([]);
        }
      } catch (err) {
        console.error("Error fetching barcode series", err);
        setBarcodeSeriesList([]);
      }
    };
    fetchSeries();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const validation: Record<string, string> = {};
    if (!fd.get("barcodeSeries")) validation.barcodeSeries = "Please select a barcode series";
    if (!fd.get("quantity") || Number(fd.get("quantity")) <= 0) validation.quantity = "Quantity must be > 0";
    // prefix/suffix optional - but include a small validation if you want
    // if (!fd.get("prefix")) validation.prefix = "Prefix is required";

    if (Object.keys(validation).length) {
      setFormErrors(validation);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      itemId: internalItemId, // internal DB id if needed by backend
      sku: itemId,
      name: itemName,
      barcodeSeriesId: Number(fd.get("barcodeSeries")),
      quantity: Number(fd.get("quantity")),
      prefix: String(fd.get("prefix") || ""),
      suffix: String(fd.get("suffix") || ""),
      manufacturingDate: String(fd.get("manufacturingDate") || ""),
      expiryDate: String(fd.get("expiryDate") || ""),
    };

    try {
      // We only need to await this - no unused variable.
      await post("/inventory/generate-barcode", payload);

      SuccessToast({
        title: "Barcode(s) generated successfully.",
        description: "",
      });

      onClose();
    } catch (err: any) {
      console.error("Barcode generate error:", err);
      setError(err?.message || "Failed to generate barcode(s).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex justify-end z-50">
      <div className="bg-white w-full max-w-xl animate-in fade-in duration-200" ref={modalRef}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 bg-neutral-100/90 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="sm:text-lg font-semibold">Generate Barcode</h3>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
                disabled={isSubmitting}
                type="button"
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

          {/* API Error */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-4 py-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Barcode Series */}
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Barcode Series</Label>
                <Select name="barcodeSeries">
                  <SelectTrigger className={`${inputClasses} w-full`}>
                    <SelectValue placeholder="Select Series" />
                  </SelectTrigger>
                  <SelectContent>
                    {barcodeSeriesList.map((series) => (
                      <SelectItem key={series.id} value={String(series.id)}>
                        {series.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.barcodeSeries && <p className="text-red-500 text-xs mt-1">{formErrors.barcodeSeries}</p>}
              </div>

              {/* Quantity */}
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Quantity</Label>
                <Input name="quantity" type="number" className={`${inputClasses} border border-neutral-200`} min={1} />
                {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
              </div>
            </div>

            {/* Item ID & Name */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Item ID</Label>
                <Input value={itemId} readOnly className={`${inputClasses} border border-neutral-200`} />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Item Name</Label>
                <Input value={itemName} readOnly className={`${inputClasses} border border-neutral-200`} />
              </div>
            </div>

            {/* Prefix & Suffix */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Prefix</Label>
                <Input name="prefix" className={`${inputClasses} border border-neutral-200`} placeholder="e.g. RM06-" />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Suffix</Label>
                <Input name="suffix" className={`${inputClasses} border border-neutral-200`} placeholder="e.g. -2025" />
              </div>
            </div>

            {/* Manufacturing & Expiry */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Manufacturing Date</Label>
                <Input name="manufacturingDate" type="date" className={`${inputClasses} border border-neutral-200`} />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Expiry Date</Label>
                <Input name="expiryDate" type="date" className={`${inputClasses} border border-neutral-200`} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

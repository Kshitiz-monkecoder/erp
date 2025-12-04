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
  internalItemId: number | null;
}

const BarcodeModal: React.FC<IBarcodeModalProps> = ({ isOpen, onClose, itemId, itemName, internalItemId }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);

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

  const downloadSampleExcel = () => {
    // Create sample data for bulk barcode upload
    const sampleData = [
      {
        prefix: "BAT",
        quantity: 100,
        suffix: "",
        manufacturingDate: "2024-12-01",
        expiryDate: "2025-12-01",
        info1: "Batch A",
        info2: "Warehouse 1",
        isActive: "true"
      },
      {
        prefix: "BAT",
        quantity: 50,
        suffix: "SPECIAL",
        manufacturingDate: "2024-12-01",
        expiryDate: "2025-06-01",
        info1: "Batch B",
        info2: "Warehouse 2",
        isActive: "true"
      }
    ];

    // Convert to CSV format
    const headers = ["prefix", "quantity", "suffix", "manufacturingDate", "expiryDate", "info1", "info2", "isActive"];
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => headers.map(header => row[header as keyof typeof row]).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `barcode_bulk_template_${itemId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        setError("Please upload a valid Excel or CSV file");
        return;
      }
      
      setExcelFile(file);
      setError(null);
      
      // TODO: Implement bulk upload logic here
      console.log("File selected for bulk upload:", file.name);
    }
  };

  const handleBulkUpload = async () => {
    if (!excelFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement bulk upload API call in separate service file
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      SuccessToast({
        title: "Bulk barcodes generated successfully.",
        description: "Barcodes created successfully.",
      });

      onClose();
    } catch (err: any) {
      console.error("Bulk barcode upload error:", err);
      setError(err?.message || "Failed to upload bulk barcodes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const validation: Record<string, string> = {};
    if (!fd.get("prefix")) validation.prefix = "Prefix is required";
    if (!fd.get("quantity") || Number(fd.get("quantity")) <= 0) validation.quantity = "Quantity must be greater than 0";

    if (Object.keys(validation).length) {
      setFormErrors(validation);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      itemId: internalItemId ? parseInt(internalItemId.toString()) : parseInt(itemId),
      prefix: String(fd.get("prefix") || ""),
      quantity: fd.get("quantity") ? Number(fd.get("quantity")) : undefined,
      suffix: String(fd.get("suffix") || "") || undefined,
      manufacturingDate: String(fd.get("manufacturingDate") || "") || undefined,
      expiryDate: String(fd.get("expiryDate") || "") || undefined,
      info1: String(fd.get("info1") || "") || undefined,
      info2: String(fd.get("info2") || "") || undefined,
      isActive: fd.get("isActive") === "true"
    };

    try {
      await post("/barcode", payload);

      SuccessToast({
        title: "Barcode generated successfully.",
        description: "",
      });

      onClose();
    } catch (err: any) {
      console.error("Barcode generate error:", err);
      setError(err?.message || "Failed to generate barcode.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-[#7047EB] h-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Generating...
                  </>
                ) : (
                  "Generate"
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

            {/* Item ID & Name */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Item ID</Label>
                <Input value={itemId} readOnly className={inputClasses} />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Item Name</Label>
                <Input value={itemName} readOnly className={inputClasses} />
              </div>
            </div>

            {/* Prefix & Suffix */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>
                  Prefix
                  <span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input 
                  name="prefix" 
                  className={inputClasses} 
                  placeholder="e.g. BAT" 
                />
                {formErrors.prefix && <p className="text-red-500 text-xs">{formErrors.prefix}</p>}
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Suffix (Optional)</Label>
                <Input 
                  name="suffix" 
                  className={inputClasses} 
                  placeholder="Custom suffix" 
                />
              </div>
            </div>

            {/* Barcode Format Helper */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">
                Barcode format: PREFIX-ITEMID-SEQUENCE (e.g., BAT-{itemId}-000001)
              </p>
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <Label className={labelClasses}>
                Quantity
                <span className="text-[#F53D6B] ml-1">*</span>
              </Label>
              <Input 
                name="quantity" 
                type="number" 
                className={inputClasses} 
                min={1} 
                placeholder="Enter quantity"
              />
              {formErrors.quantity && <p className="text-red-500 text-xs">{formErrors.quantity}</p>}
            </div>

            {/* Manufacturing & Expiry Dates */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Manufacturing Date (Optional)</Label>
                <Input name="manufacturingDate" type="date" className={inputClasses} />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Expiry Date (Optional)</Label>
                <Input name="expiryDate" type="date" className={inputClasses} />
              </div>
            </div>

            {/* Additional Info Fields */}
            <div className="flex gap-4">
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Info 1 (Optional)</Label>
                <Input 
                  name="info1" 
                  className={inputClasses} 
                  placeholder="Additional information 1" 
                />
              </div>
              <div className="w-full space-y-1">
                <Label className={labelClasses}>Info 2 (Optional)</Label>
                <Input 
                  name="info2" 
                  className={inputClasses} 
                  placeholder="Additional information 2" 
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label className={labelClasses}>Status</Label>
              <Select name="isActive" defaultValue="true">
                <SelectTrigger className={inputClasses}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Bulk Upload Section - Simple version */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className={labelClasses}>Bulk Upload (Optional)</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload Excel/CSV file to generate multiple barcodes at once
                </p>
                
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className={inputClasses}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={!excelFile || isSubmitting}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Upload File"
                    )}
                  </Button>
                </div>
                
                {excelFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {excelFile.name}
                  </p>
                )}
              </div>

              {/* Download Sample */}
              <div className="space-y-2">
                <Label className={labelClasses}>Download Template</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadSampleExcel}
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Sample Template
                </Button>
                <p className="text-xs text-gray-500">
                  Download the template file, fill in your barcode data, and upload the completed file.
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
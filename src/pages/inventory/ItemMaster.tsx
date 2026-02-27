// src/pages/ItemMaster.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import UniversalTable from "@/components/app/tables";
import { InventoryItem } from "./types";
import { get } from "@/lib/apiService";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, ChevronDown, Filter, Plus, RefreshCcw, ArrowRightLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectFilter, { OptionType } from "@/components/app/SelectFilter";
import MultiSelectWithSearch from "@/components/app/MultiSelectWithSearch";
import AddInventoryItemModal from "@/components/app/modals/AddInventoryItemModal";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import CreateStockTransferModal from "@/components/app/modals/CreateStockTransferModal";
import UpdateProductStockModal from "@/components/ui/UpdateProductStockModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = "all" | "negative" | "low" | "excess";

// ─── Constants ────────────────────────────────────────────────────────────────

const productOptions: OptionType[] = [
  { label: "All Items", value: "all" },
  { label: "Products", value: "true" },
  { label: "Service", value: "false" },
];

const statusOptions: OptionType[] = [
  { label: "All", value: "all" },
  { label: "Negative Stock", value: "negative" },
  { label: "Low Stock", value: "low" },
  { label: "Excess Stock", value: "excess" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isNegativeStock = (item: InventoryItem) => Number(item.currentStock) < 0;
const isLowStock = (item: InventoryItem) =>
  Number(item.currentStock) >= 0 &&
  Number(item.currentStock) < Number(item.minimumStockLevel ?? 0);
const isExcessStock = (item: InventoryItem) =>
  Number(item.currentStock) > Number(item.maximumStockLevel ?? Infinity);

// ─── Stock Card ───────────────────────────────────────────────────────────────

interface StockCardProps {
  label: string;
  count: number;
  status: StockStatus;
  activeStatus: StockStatus;
  onClick: (s: StockStatus) => void;
  color: "red" | "amber" | "blue";
}

const colorMap = {
  red: {
    activeBorder: "border-red-400",
    activeLabel: "text-red-600",
    activeCount: "text-red-600",
    activeBg: "bg-red-50",
    inactiveBorder: "border-red-200",
    inactiveBg: "bg-red-50/40",
    inactiveLabel: "text-red-400",
    inactiveCount: "text-red-500",
    filterIcon: "text-red-400",
  },
  amber: {
    activeBorder: "border-amber-400",
    activeLabel: "text-amber-700",
    activeCount: "text-amber-700",
    activeBg: "bg-amber-50",
    inactiveBorder: "border-amber-200",
    inactiveBg: "bg-amber-50/40",
    inactiveLabel: "text-amber-500",
    inactiveCount: "text-amber-600",
    filterIcon: "text-amber-400",
  },
  blue: {
    activeBorder: "border-blue-400",
    activeLabel: "text-blue-700",
    activeCount: "text-blue-700",
    activeBg: "bg-blue-50",
    inactiveBorder: "border-blue-200",
    inactiveBg: "bg-blue-50/40",
    inactiveLabel: "text-blue-400",
    inactiveCount: "text-blue-500",
    filterIcon: "text-blue-400",
  },
};

const StockCard: React.FC<StockCardProps> = ({ label, count, status, activeStatus, onClick, color }) => {
  const isActive = activeStatus === status;
  const c = colorMap[color];
  return (
    <button
      onClick={() => onClick(isActive ? "all" : status)}
      className={`
        flex items-center justify-between flex-1 px-5 py-3 rounded-lg border-2 transition-all duration-150 select-none text-left
        ${isActive
          ? `${c.activeBorder} ${c.activeBg} shadow-sm`
          : `${c.inactiveBorder} ${c.inactiveBg} hover:shadow-sm`}
      `}
    >
      <span className={`text-sm font-semibold ${isActive ? c.activeLabel : c.inactiveLabel}`}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold ${isActive ? c.activeCount : c.inactiveCount}`}>
          {count}
        </span>
        <Filter className={`w-4 h-4 ${c.filterIcon} ${isActive ? "opacity-100" : "opacity-60"}`} />
      </div>
    </button>
  );
};

// ─── Actions Dropdown ─────────────────────────────────────────────────────────

interface ActionsDropdownProps {
  onUpdateStock: () => void;
  onStockTransfer: () => void;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onUpdateStock, onStockTransfer }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-[7px] rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors shadow-sm h-8"
      >
        Actions
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1.5 overflow-hidden">
          {/* Update Product Stock */}
          <button
            onClick={() => { setOpen(false); onUpdateStock(); }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-emerald-100 group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <RefreshCcw className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Update Product Stock</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">Add or reduce item quantity in bulk</p>
            </div>
          </button>

          <div className="mx-3 border-t border-gray-100" />

          {/* Stock Transfer */}
          <button
            onClick={() => { setOpen(false); onStockTransfer(); }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-blue-100 group-hover:bg-blue-200 transition-colors flex-shrink-0">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Stock Transfer</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">Transfer your items between stores</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ItemMaster: React.FC = () => {
  const [itemData, setItemData] = useState<Array<InventoryItem>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [maxID, setMaxID] = useState<number>(0);
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [activeStockStatus, setActiveStockStatus] = useState<StockStatus>("all");

  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState(false);
  const [showAddInventoryItemModal, setShowAddInventoryItemModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [showStockTransferModal, setShowStockTransferModal] = useState(false);

  const navigateTo = useNavigate();

  useEffect(() => {
    fetchInventoryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductType]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      let queryParams = "";
      if (selectedProductType === "true") queryParams = "?isProduct=true";
      else if (selectedProductType === "false") queryParams = "?isProduct=false";
      const response = await get(`/inventory/item${queryParams}`);
      if (!response) throw new Error("Invalid response from server");
      const data: InventoryItem[] = response.data || [];
      setItemData(data);
      setMaxID(data.reduce((max: number, item: InventoryItem) => Math.max(max, (item.id as number) || 0), 0));
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  const negativeCount = useMemo(() => itemData.filter(isNegativeStock).length, [itemData]);
  const lowCount = useMemo(() => itemData.filter(isLowStock).length, [itemData]);
  const excessCount = useMemo(() => itemData.filter(isExcessStock).length, [itemData]);

  const filteredData = useMemo(() => {
    if (activeStockStatus === "negative") return itemData.filter(isNegativeStock);
    if (activeStockStatus === "low") return itemData.filter(isLowStock);
    if (activeStockStatus === "excess") return itemData.filter(isExcessStock);
    return itemData;
  }, [itemData, activeStockStatus]);

  const handleProductTypeChange = (value: string) => { setSelectedProductType(value); setActiveStockStatus("all"); };
  const handleStockStatusChange = (status: StockStatus) => setActiveStockStatus(status);
  const handleStatusDropdownChange = (value: string) => setActiveStockStatus(value as StockStatus);
  const handleRefreshItemTable = () => fetchInventoryItems();

  const toggleAddUnitOfMeasurementModal = () => setShowAddUnitOfMeasurementModal((p) => !p);
  const toggleAddInventoryItemModal = () => setShowAddInventoryItemModal((p) => !p);
  const toggleAddWarehouseModal = () => setShowAddWarehouseModal((p) => !p);
  const toggleAddCategoriesModal = () => setShowAddCategoriesModal((p) => !p);

  const columns: ColumnDef<InventoryItem>[] = [
    {
      header: "Item Id",
      accessorKey: "itemId",
      cell: ({ row }) => (
        <div
          onClick={() => navigateTo(`/inventory/item-details/${row.original.id}`)}
          className="font-normal text-blue-500 gap-2 min-w-56 flex items-center cursor-pointer"
        >
          {row.original.sku}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
      meta: { filterVariant: "select" },
    },
    {
      header: "Item Name",
      accessorKey: "itemName",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.name}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Item Category",
      accessorKey: "itemCategory",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.category?.name}</div>,
      filterFn: "equals",
      meta: { filterVariant: "select" },
    },
    {
      header: "Unit",
      accessorKey: "unit",
      cell: ({ row }) => <div className="font-normal">{row.original.unit?.name}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Current Stock",
      accessorKey: "currentStock",
      cell: ({ row }) => {
        const stock = Number(row.original.currentStock);
        return (
          <div className={`font-semibold min-w-28 ${stock < 0 ? "text-red-500" : "text-gray-800"}`}>
            {stock.toLocaleString()}
          </div>
        );
      },
      meta: { filterVariant: "select" },
    },
    {
      header: "Default Price",
      accessorKey: "defaultPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.defaultPrice}</div>,
      meta: { filterVariant: "select" },
    },
    {
      header: "Regular Buying Price",
      accessorKey: "regularBuyingPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.regularBuyingPrice}</div>,
      meta: { filterVariant: "select" },
    },
  ];

  return (
    <>
      {/* ── Stock Summary Bar ─────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-4 items-stretch">
        <StockCard label="Negative Stock" count={negativeCount} status="negative" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="red" />
        <StockCard label="Low Stock" count={lowCount} status="low" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="amber" />
        <StockCard label="Excess Stock" count={excessCount} status="excess" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="blue" />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {/*
        We intentionally omit enableCreate / onCreateClick from UniversalTable
        and instead render both the Actions button AND the Add Item button
        ourselves inside customFilterSection using ml-auto, so they appear
        side-by-side in the correct order: [Actions] [+ Add Item]
      */}
      <UniversalTable<InventoryItem>
        data={filteredData}
        columns={columns}
        isLoading={loading}
        customFilterSection={() => (
          <>
            {/* ── Left: filter controls ── */}
            <SelectFilter
              label="Products/Services"
              items={productOptions}
              defaultValue={productOptions[0].value}
              onValueChange={handleProductTypeChange}
            />
            <SelectFilter
              label="Status"
              items={statusOptions}
              defaultValue={activeStockStatus}
              onValueChange={handleStatusDropdownChange}
            />
            <MultiSelectWithSearch columns={[]} label="Show/Hide Columns" />

            {/* ── Right: Actions + Add Item ── */}
            <div className="flex items-center gap-2 ml-auto">
              <ActionsDropdown
                onUpdateStock={() => setShowUpdateStockModal(true)}
                onStockTransfer={() => setShowStockTransferModal(true)}
              />
              <button
                onClick={toggleAddInventoryItemModal}
                className="flex items-center gap-1.5 bg-[#7047EB] hover:bg-[#5f3bcc] text-white text-sm font-medium px-4 py-[7px] rounded-md h-8 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </>
        )}
      />

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      <UpdateProductStockModal
        isOpen={showUpdateStockModal}
        onClose={() => setShowUpdateStockModal(false)}
        onSuccess={() => fetchInventoryItems()}
        items={itemData.map((i) => ({
          id: i.id as number,
          name: i.name,
          sku: i.sku,
          currentStock: Number(i.currentStock),
          defaultPrice: i.defaultPrice,
          unit: i.unit,
        }))}
      />

      <CreateStockTransferModal
        isOpen={showStockTransferModal}
        onClose={() => setShowStockTransferModal(false)}
      />

      <AddInventoryItemModal
        isAnyModalOpen={showAddCategoriesModal || showAddWarehouseModal || showAddUnitOfMeasurementModal}
        isOpen={showAddInventoryItemModal}
        onClose={toggleAddInventoryItemModal}
        showAddUnitOfMeasurementModal={toggleAddUnitOfMeasurementModal}
        showAddWarehouseModal={toggleAddWarehouseModal}
        showShowCategoriesModal={toggleAddCategoriesModal}
        currentItemNo={maxID + 1}
        onItemAdded={handleRefreshItemTable}
      />

      <AddUnitOfMeasurementModal isOpen={showAddUnitOfMeasurementModal} onClose={toggleAddUnitOfMeasurementModal} />
      <AddCategoriesModal isOpen={showAddCategoriesModal} onClose={toggleAddCategoriesModal} onSuccess={() => {}} />
      <AddWarehouseModal isOpen={showAddWarehouseModal} onClose={toggleAddWarehouseModal} onSuccess={() => {}} />
    </>
  );
};

export default ItemMaster;
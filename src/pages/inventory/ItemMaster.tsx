// src/pages/ItemMaster.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import UniversalTable from "@/components/app/tables";
import { InventoryItem } from "./types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight, ChevronDown, Filter, Plus, RefreshCcw,
  ArrowRightLeft, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SelectFilter, { OptionType } from "@/components/app/SelectFilter";
import MultiSelectWithSearch from "@/components/app/MultiSelectWithSearch";
import AddInventoryItemModal from "@/components/app/modals/AddInventoryItemModal";
import AddUnitOfMeasurementModal from "@/components/app/modals/AddUnitOfMeasurementModal";
import AddCategoriesModal from "@/components/app/modals/AddCategoriesModal";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import CreateStockTransferModal from "@/components/app/modals/CreateStockTransferModal";
import UpdateProductStockModal from "@/components/ui/UpdateProductStockModal";
import { itemAPI, StockStatus, ItemSortField } from "@/services/itemService";

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

// Column id → API sort field
const SORT_FIELD_MAP: Record<string, ItemSortField> = {
  itemId: "sku",
  itemName: "name",
  itemCategory: "category",
  unit: "unit",
  currentStock: "currentStock",
  defaultPrice: "defaultPrice",
};

// ─── Sort direction state ─────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

interface SortState {
  columnId: string | null;
  direction: SortDir;
}

// Sort icon helper
const SortIcon: React.FC<{ columnId: string; sortState: SortState }> = ({ columnId, sortState }) => {
  if (sortState.columnId !== columnId) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-300" />;
  if (sortState.direction === "asc") return <ArrowUp className="w-3.5 h-3.5 ml-1 text-[#7047EB]" />;
  return <ArrowDown className="w-3.5 h-3.5 ml-1 text-[#7047EB]" />;
};

// ─── FIFO Toggle ──────────────────────────────────────────────────────────────

interface FifoToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const FifoToggle: React.FC<FifoToggleProps> = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all duration-200 select-none h-full
      ${enabled
        ? "border-violet-400 bg-violet-50 shadow-sm"
        : "border-violet-200 bg-violet-50/40 hover:shadow-sm"
      }`}
    title="Toggle FIFO (First In, First Out) stock valuation method"
  >
    <div className="text-left">
      <p className={`text-xs font-bold tracking-wide uppercase ${enabled ? "text-violet-700" : "text-violet-400"}`}>
        FIFO
      </p>
      <p className={`text-[10px] leading-tight mt-0.5 ${enabled ? "text-violet-500" : "text-violet-300"}`}>
        First In, First Out
      </p>
    </div>
    {/* Toggle pill */}
    <div
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0
        ${enabled ? "bg-violet-500" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  </button>
);

// ─── Stock Card ───────────────────────────────────────────────────────────────

interface StockCardProps {
  label: string;
  count: number;
  status: StockStatus;
  activeStatus: StockStatus | "all";
  onClick: (s: StockStatus) => void;
  color: "red" | "amber" | "blue";
}

const colorMap = {
  red: {
    activeBorder: "border-red-400", activeLabel: "text-red-600", activeCount: "text-red-600", activeBg: "bg-red-50",
    inactiveBorder: "border-red-200", inactiveBg: "bg-red-50/40", inactiveLabel: "text-red-400", inactiveCount: "text-red-500", filterIcon: "text-red-400",
  },
  amber: {
    activeBorder: "border-amber-400", activeLabel: "text-amber-700", activeCount: "text-amber-700", activeBg: "bg-amber-50",
    inactiveBorder: "border-amber-200", inactiveBg: "bg-amber-50/40", inactiveLabel: "text-amber-500", inactiveCount: "text-amber-600", filterIcon: "text-amber-400",
  },
  blue: {
    activeBorder: "border-blue-400", activeLabel: "text-blue-700", activeCount: "text-blue-700", activeBg: "bg-blue-50",
    inactiveBorder: "border-blue-200", inactiveBg: "bg-blue-50/40", inactiveLabel: "text-blue-400", inactiveCount: "text-blue-500", filterIcon: "text-blue-400",
  },
};

const StockCard: React.FC<StockCardProps> = ({ label, count, status, activeStatus, onClick, color }) => {
  const isActive = activeStatus === status;
  const c = colorMap[color];
  return (
    <button
      onClick={() => onClick(status)}
      className={`flex items-center justify-between flex-1 px-5 py-3 rounded-lg border-2 transition-all duration-150 select-none text-left
        ${isActive ? `${c.activeBorder} ${c.activeBg} shadow-sm` : `${c.inactiveBorder} ${c.inactiveBg} hover:shadow-sm`}`}
    >
      <span className={`text-sm font-semibold ${isActive ? c.activeLabel : c.inactiveLabel}`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xl font-bold ${isActive ? c.activeCount : c.inactiveCount}`}>{count}</span>
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
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-[7px] rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors shadow-sm h-8"
      >
        Actions
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-gray-100 shadow-xl z-30 py-1.5 overflow-hidden">
          <button onClick={() => { setOpen(false); onUpdateStock(); }} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors group">
            <div className="mt-0.5 p-1.5 rounded-md bg-emerald-100 group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <RefreshCcw className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Update Product Stock</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">Add or reduce item quantity in bulk</p>
            </div>
          </button>
          <div className="mx-3 border-t border-gray-100" />
          <button onClick={() => { setOpen(false); onStockTransfer(); }} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group">
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
  const [itemData, setItemData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [maxID, setMaxID] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [summary, setSummary] = useState({ negativeStock: 0, lowStock: 0, excessStock: 0 });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortState, setSortState] = useState<SortState>({ columnId: null, direction: null });
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [activeStockStatus, setActiveStockStatus] = useState<StockStatus | "all">("all");
  const [fifoEnabled, setFifoEnabled] = useState<boolean>(false);

  const [showAddUnitOfMeasurementModal, setShowAddUnitOfMeasurementModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showAddCategoriesModal, setShowAddCategoriesModal] = useState(false);
  const [showAddInventoryItemModal, setShowAddInventoryItemModal] = useState(false);
  const [showUpdateStockModal, setShowUpdateStockModal] = useState(false);
  const [showStockTransferModal, setShowStockTransferModal] = useState(false);

  const navigateTo = useNavigate();

  // ─── Column sort click handler ────────────────────────────────────────────

  const handleColumnSort = useCallback((columnId: string) => {
    if (!(columnId in SORT_FIELD_MAP)) return;
    setSortState(prev => {
      if (prev.columnId !== columnId) return { columnId, direction: "asc" };
      if (prev.direction === "asc") return { columnId, direction: "desc" };
      return { columnId: null, direction: null };
    });
    setPage(1);
  }, []);

  // ─── Build payload ────────────────────────────────────────────────────────

  const buildPayload = useCallback(() => {
    const hasSorting = sortState.columnId && sortState.direction;
    return {
      filters: {
        ...(selectedProductType !== "all" && { isProduct: selectedProductType === "true" }),
        ...(activeStockStatus !== "all" && { stockStatus: activeStockStatus as StockStatus }),
        itemStatus: "all",
        ...(fifoEnabled && { valuationMethod: "fifo" }),
      },
      search: {},
      pagination: {
        page,
        itemsPerPage: pageSize,
        sortBy: hasSorting ? [SORT_FIELD_MAP[sortState.columnId!]] : ["createdAt" as ItemSortField],
        sortDesc: hasSorting ? [sortState.direction === "desc"] : [true],
      },
    };
  }, [selectedProductType, activeStockStatus, page, pageSize, sortState, fifoEnabled]);

  // ─── Fetch items ──────────────────────────────────────────────────────────

  const fetchInventoryItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await itemAPI.getItems(buildPayload());
      if (response.status) {
        // API returns data as a flat array directly
        const raw = response.data as unknown;
        const data = (Array.isArray(raw) ? raw : (raw as any)?.data ?? []) as InventoryItem[];
        const total = Array.isArray(raw) ? data.length : ((raw as any)?.total_length ?? data.length);
        setItemData(data);
        setTotalItems(total);
        setMaxID(data.reduce((max, item) => Math.max(max, (item.id as number) || 0), 0));
        if ((response as any).summary) setSummary((response as any).summary);
      }
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    } finally {
      setLoading(false);
    }
  }, [buildPayload]);

  useEffect(() => { fetchInventoryItems(); }, [fetchInventoryItems]);

  const handleProductTypeChange = (value: string) => { setSelectedProductType(value); setActiveStockStatus("all"); setPage(1); };
  const handleStockStatusChange = (status: StockStatus) => { setActiveStockStatus(prev => prev === status ? "all" : status); setPage(1); };
  const handleStatusDropdownChange = (value: string) => { setActiveStockStatus(value as StockStatus | "all"); setPage(1); };
  const handleRefreshItemTable = () => { fetchInventoryItems(); };
  const handleFifoToggle = () => { setFifoEnabled(prev => !prev); setPage(1); };

  const toggleAddUnitOfMeasurementModal = () => setShowAddUnitOfMeasurementModal(p => !p);
  const toggleAddInventoryItemModal = () => setShowAddInventoryItemModal(p => !p);
  const toggleAddWarehouseModal = () => setShowAddWarehouseModal(p => !p);
  const toggleAddCategoriesModal = () => setShowAddCategoriesModal(p => !p);

  const totalPages = Math.ceil(totalItems / pageSize);

  // ─── Columns ──────────────────────────────────────────────────────────────

  // Wrap sortable column headers with click handlers and sort icons
  const sortableHeader = (label: string, columnId: string) => (
    <button
      className="flex items-center font-medium text-inherit hover:text-[#7047EB] transition-colors"
      onClick={() => handleColumnSort(columnId)}
    >
      {label}
      <SortIcon columnId={columnId} sortState={sortState} />
    </button>
  );

  const columns: ColumnDef<InventoryItem>[] = useMemo(() => [
    {
      header: () => sortableHeader("Item Id", "itemId"),
      accessorKey: "itemId",
      id: "itemId",
      cell: ({ row }) => (
        <div
          onClick={() => navigateTo(`/inventory/item-details/${row.original.id}`)}
          className="font-normal text-blue-500 gap-2 min-w-56 flex items-center cursor-pointer"
        >
          {row.original.sku}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
    },
    {
      header: () => sortableHeader("Item Name", "itemName"),
      accessorKey: "itemName",
      id: "itemName",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.name}</div>,
    },
    {
      header: () => sortableHeader("Item Category", "itemCategory"),
      accessorKey: "itemCategory",
      id: "itemCategory",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.category?.name}</div>,
    },
    {
      header: () => sortableHeader("Unit", "unit"),
      accessorKey: "unit",
      id: "unit",
      cell: ({ row }) => <div className="font-normal">{row.original.unit?.name}</div>,
    },
    {
      header: () => sortableHeader("Current Stock", "currentStock"),
      accessorKey: "currentStock",
      id: "currentStock",
      cell: ({ row }) => {
        const stock = Number(row.original.currentStock);
        return <div className={`font-semibold min-w-28 ${stock < 0 ? "text-red-500" : "text-gray-800"}`}>{stock.toLocaleString()}</div>;
      },
    },
    {
      header: () => sortableHeader("Default Price", "defaultPrice"),
      accessorKey: "defaultPrice",
      id: "defaultPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.defaultPrice}</div>,
    },
    {
      header: "Regular Buying Price",
      accessorKey: "regularBuyingPrice",
      id: "regularBuyingPrice",
      cell: ({ row }) => <div className="font-normal min-w-32">{row.original.regularBuyingPrice}</div>,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigateTo, sortState]);

  return (
    <>
      {/* ── Stock Summary Bar ──────────────────────────────────────────────── */}
      <div className="flex gap-3 mb-4 items-stretch">
        <StockCard label="Negative Stock" count={summary.negativeStock} status="negative" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="red" />
        <StockCard label="Low Stock" count={summary.lowStock} status="low" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="amber" />
        <StockCard label="Excess Stock" count={summary.excessStock} status="excess" activeStatus={activeStockStatus} onClick={handleStockStatusChange} color="blue" />
        <FifoToggle enabled={fifoEnabled} onToggle={handleFifoToggle} />
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <UniversalTable<InventoryItem>
        data={itemData}
        columns={columns}
        isLoading={loading}
        enablePagination={false}
        enableFiltering={false}
        customFilterSection={() => (
          <>
            <SelectFilter label="Products/Services" items={productOptions} defaultValue={productOptions[0].value} onValueChange={handleProductTypeChange} />
            <SelectFilter label="Status" items={statusOptions} defaultValue={activeStockStatus} onValueChange={handleStatusDropdownChange} />
            <MultiSelectWithSearch columns={[]} label="Show/Hide Columns" />
            <div className="flex items-center gap-2 ml-auto">
              <ActionsDropdown onUpdateStock={() => setShowUpdateStockModal(true)} onStockTransfer={() => setShowStockTransferModal(true)} />
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

      {/* ── Server-side Pagination ─────────────────────────────────────────── */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-5 mt-4">
          <div className="flex gap-3 md:gap-5 items-center">
            <div className="flex items-center text-neutral-600 gap-2">
              <div className="text-xs">Rows per page:</div>
              <select
                className="text-xs bg-neutral-100 shadow rounded-sm px-2 py-1 cursor-pointer"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button className="text-neutral-600 disabled:opacity-40" onClick={() => setPage(1)} disabled={page <= 1}>{"<<"}</button>
            <button className="text-neutral-600 disabled:opacity-40" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>{"<"}</button>
            <button className="text-neutral-600 disabled:opacity-40" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>{">"}</button>
            <button className="text-neutral-600 disabled:opacity-40" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>{">>"}</button>
          </div>
          <span className="text-xs text-neutral-600">
            Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            <span className="text-neutral-400 ml-2">({totalItems} items)</span>
          </span>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <UpdateProductStockModal
        isOpen={showUpdateStockModal}
        onClose={() => setShowUpdateStockModal(false)}
        onSuccess={handleRefreshItemTable}
        items={itemData.map(i => ({ id: i.id as number, name: i.name, sku: i.sku, currentStock: Number(i.currentStock), defaultPrice: i.defaultPrice, unit: i.unit }))}
      />
      <CreateStockTransferModal isOpen={showStockTransferModal} onClose={() => setShowStockTransferModal(false)} />
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
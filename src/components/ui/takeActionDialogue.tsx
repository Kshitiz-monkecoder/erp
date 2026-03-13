// src/components/production/TakeActionsDialog.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Package,
  GitBranch,
  DollarSign,
  Trash2,
  Zap,
  Users,
  Factory,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { get } from "@/lib/apiService";

// ─────────────────────────────────────────────
// Re-usable types (subset matching process-details.tsx)
// ─────────────────────────────────────────────
interface FinishedGood {
  id: number;
  req_quantity: number;
  total_mfg_quantity: number;
  tested_quantity: number;
  accept_quantity: number;
  reject_quantity: number;
  actual_used_quantity: number;
  comment: string | null;
  itemName?: string;
  unit?: string;
  costAlloc?: number;
  forRepair?: number;
  repaired?: number;
  bomFinishedGoodsId: number;
  /** Hydrated inventory item — used to read the real item ID for barcodes */
  itemData?: { id: string; [key: string]: any };
}

interface RawMaterial {
  id: number;
  req_quantity: number;
  actual_used_quantity: number;
  tested_quantity: number;
  comment: string | null;
  itemName?: string;
  currentStock?: string;
  estimatedProduction?: number;
  produced?: number;
  unit?: string;
  bomRawMaterialId: number;
}

interface RoutingItem {
  /** Routing template id */
  routingId?: number;
  /** Production routing record id */
  productionRoutingId?: number;
  routingNumber?: string;
  routingName?: string;
  is_done?: boolean;
  quantity_completed?: number;
  comment?: string;
  createdAt?: string;
}

interface Scrap {
  id: number;
  quantity: number;
  actual_quantity: number;
  cost_alloc: number;
  comment: string | null;
  itemName?: string;
  unit?: string;
  bomScrapId: number;
}

interface OtherCharge {
  id: number;
  charges_estimate: number;
  comment: string | null;
  bomOtherChargeId: number;
  bomOtherCharge?: {
    id: number;
    classification: string;
    charges: number;
  };
}

interface ProcessLevelData {
  id: number;
  bomItemId: number;
  finishedGoods: FinishedGood[];
  rawMaterials: RawMaterial[];
  routing: RoutingItem[];
  scrap: Scrap[];
  otherCharges: OtherCharge[];
}

// ─────────────────────────────────────────────
// Local action row shapes
// ─────────────────────────────────────────────
export interface FGActionRow {
  bomFinishedGoodsId: number;
  /** Production FG record ID — used as fgId in the barcode API */
  itemId: string;
  /** Actual inventory item ID — used as itemId in the barcode API */
  inventoryItemId: string;
  itemName: string;
  itemCategory: string;
  unit: string;
  targetProduction: number;
  completed: number;
  tested: number;
  passed: number;
  rejected: number;
  store: string;
  quantityAdded: number;
  newQuantity: number;
  comment: string;
}

export interface RMActionRow {
  bomRawMaterialId: number;
  itemId: string;
  itemName: string;
  currentStock: number;
  estimatedRM: number;
  usedRM: number;
  unit: string;
  comment: string;
  store: string;
  addLess: string;
  quantity: number;
  newQuantity: number;
  /** Optional barcode record ID to consume a specific barcode (sent as barcodeId in rm_data payload) */
  barcodeId?: number | null;
}

export interface RoutingActionRow {
  /** The routing template ID (bomRouting -> routing -> id) */
  routingId?: number;
  /** The production routing record ID (used as the API "id" key) */
  productionRoutingId?: number;
  routingNumber: string;
  routingName: string;
  currentFGQty: number;
  changeInFGQty: number;
  finalFGQty: number;
  completionPercent: number;
  comment: string;
  markDone: boolean;
  /** Order / index within the routing list */
  order?: number;
}

export interface ScrapActionRow {
  bomScrapId: number;
  itemId: string;
  itemName: string;
  unit: string;
  estimatedQty: number;
  actualQty: number;
  costAlloc: number;
  store: string;
  comment: string;
}

export interface OtherChargeActionRow {
  bomOtherChargeId: number;
  classification: string;
  estimatedAmount: number;
  actualAmount: number;
  comment: string;
}

// ─────────────────────────────────────────────
// Section key
// ─────────────────────────────────────────────
export type TakeActionSection =
  | "markFGProduced"
  | "issueRM"
  | "logRoutingData"
  | "markScrap"
  | "logOtherCharges";

interface SectionState {
  markFGProduced: boolean;
  issueRM: boolean;
  logRoutingData: boolean;
  markScrap: boolean;
  logOtherCharges: boolean;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
export interface TakeActionsDialogProps {
  open: boolean;
  onClose: () => void;
  processNumber: string;
  levels: ProcessLevelData[];
  defaultSection?: TakeActionSection;
  onSaveChanges?: (data: {
    fgRows: FGActionRow[];
    rmRows: RMActionRow[];
    routingRows: RoutingActionRow[];
    scrapRows: ScrapActionRow[];
    chargeRows: OtherChargeActionRow[];
    markTestedAndPassed: boolean;
  }) => Promise<void>;
}

// ─────────────────────────────────────────────
// Collapsible Section wrapper
// ─────────────────────────────────────────────
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, expanded, onToggle, children }) => (
  <div className="border-b last:border-b-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
    >
      <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
        {icon}
        {title}
      </span>
      {expanded
        ? <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
        : <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />}
    </button>
    {expanded && <div className="px-6 pb-6">{children}</div>}
  </div>
);

// ─────────────────────────────────────────────
// Shared table header style
// ─────────────────────────────────────────────
const TH: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <th
    className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-700 border-r last:border-r-0 whitespace-nowrap ${className}`}
    style={{ backgroundColor: "#b2d8e8" }}
  >
    {children}
  </th>
);

// ─────────────────────────────────────────────
// Underline-only editable Input (matching design)
// ─────────────────────────────────────────────
const UnderlineInput: React.FC<{
  value: number | string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}> = ({ value, onChange, type = "number", className = "" }) => (
  <Input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`h-7 text-xs text-center border-0 border-b-2 border-blue-400 rounded-none shadow-none focus-visible:ring-0 bg-transparent ${className}`}
  />
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const TakeActionsDialog: React.FC<TakeActionsDialogProps> = ({
  open,
  onClose,
  processNumber,
  levels,
  defaultSection,
  onSaveChanges,
}) => {
  const [saving, setSaving] = useState(false);
  const [markTestedAndPassed, setMarkTestedAndPassed] = useState(true);
  const [rmIdSearch, setRmIdSearch] = useState("");
  const [rmNameSearch, setRmNameSearch] = useState("");

  const [sections, setSections] = useState<SectionState>({
    markFGProduced: false,
    issueRM: false,
    logRoutingData: false,
    markScrap: false,
    logOtherCharges: false,
  });

  // Row data
  const [fgRows, setFgRows] = useState<FGActionRow[]>([]);
  const [rmRows, setRmRows] = useState<RMActionRow[]>([]);
  const [routingRows, setRoutingRows] = useState<RoutingActionRow[]>([]);
  const [scrapRows, setScrapRows] = useState<ScrapActionRow[]>([]);
  const [chargeRows, setChargeRows] = useState<OtherChargeActionRow[]>([]);

  // ── Per-item barcode options (keyed by itemId, fetched lazily) ──
  const [itemBarcodes, setItemBarcodes] = useState<Record<string, { id: number; barcodeNumber: string; quantity: number }[]>>({});
  const [barcodeLoading, setBarcodeLoading] = useState<Record<string, boolean>>({});

  const fetchBarcodesForItem = useCallback(async (itemId: string) => {
    if (!itemId || itemBarcodes[itemId] !== undefined) return;
    setBarcodeLoading((p) => ({ ...p, [itemId]: true }));
    try {
      const res = await get(`/inventory/item/${itemId}/barcodes`);
      if (res?.status && Array.isArray(res.data)) {
        setItemBarcodes((p) => ({ ...p, [itemId]: res.data }));
      } else {
        setItemBarcodes((p) => ({ ...p, [itemId]: [] }));
      }
    } catch {
      setItemBarcodes((p) => ({ ...p, [itemId]: [] }));
    } finally {
      setBarcodeLoading((p) => ({ ...p, [itemId]: false }));
    }
  }, [itemBarcodes]);

  // ── Populate rows from levels whenever dialog opens ──
  useEffect(() => {
    if (!open || levels.length === 0) return;

    setFgRows(
      levels.flatMap((lvl) =>
        lvl.finishedGoods.map((f) => ({
          bomFinishedGoodsId: f.bomFinishedGoodsId,
          itemId: String(f.id),
          inventoryItemId: f.itemData?.id ?? "",
          itemName: f.itemName || "—",
          itemCategory: "—",
          unit: f.unit || "Kg",
          targetProduction: f.req_quantity,
          completed: f.total_mfg_quantity,
          tested: f.tested_quantity,
          passed: f.accept_quantity,
          rejected: f.reject_quantity,
          store: "Default Stock Store",
          quantityAdded: 0,
          newQuantity: f.total_mfg_quantity,
          comment: f.comment || "",
        }))
      )
    );

    setRmRows(
      levels.flatMap((lvl) =>
        lvl.rawMaterials.map((r) => ({
          bomRawMaterialId: r.bomRawMaterialId,
          itemId: String(r.id),
          itemName: r.itemName || "—",
          currentStock: parseFloat(r.currentStock || "0"),
          estimatedRM: r.req_quantity,
          usedRM: r.actual_used_quantity,
          unit: r.unit || "Kg",
          comment: r.comment || "",
          store: "Default Stock Store",
          addLess: "Issue from ...",
          quantity: 0,
          newQuantity: 0,
        }))
      )
    );

    setRoutingRows(
      levels.flatMap((lvl) =>
        lvl.routing.map((r, idx) => ({
          routingId: r.routingId,
          productionRoutingId: r.productionRoutingId,
          routingNumber: r.routingNumber || "—",
          routingName: r.routingName || "—",
          currentFGQty: 0,
          changeInFGQty: 0,
          finalFGQty: 0,
          completionPercent: 0,
          comment: r.comment || "",
          markDone: r.is_done || false,
          order: idx + 1,
        }))
      )
    );

    setScrapRows(
      levels.flatMap((lvl) =>
        lvl.scrap.map((s) => ({
          bomScrapId: s.bomScrapId,
          itemId: String(s.id),
          itemName: s.itemName || "—",
          unit: s.unit || "Kg",
          estimatedQty: s.quantity,
          actualQty: s.actual_quantity,
          costAlloc: s.cost_alloc,
          store: "Default Stock Store",
          comment: s.comment || "",
        }))
      )
    );

    setChargeRows(
      levels.flatMap((lvl) =>
        lvl.otherCharges.map((oc) => ({
          bomOtherChargeId: oc.bomOtherChargeId,
          classification: oc.bomOtherCharge?.classification || "—",
          estimatedAmount: oc.bomOtherCharge?.charges ?? 0,
          actualAmount: oc.charges_estimate,
          comment: oc.comment || "",
        }))
      )
    );
  }, [open, levels]);

  // ── Auto-expand the triggered section ──
  useEffect(() => {
    if (open && defaultSection) {
      setSections({
        markFGProduced: defaultSection === "markFGProduced",
        issueRM: defaultSection === "issueRM",
        logRoutingData: defaultSection === "logRoutingData",
        markScrap: defaultSection === "markScrap",
        logOtherCharges: defaultSection === "logOtherCharges",
      });
    }
    if (!open) {
      setRmIdSearch("");
      setRmNameSearch("");
    }
  }, [open, defaultSection]);

  // Pre-fetch barcodes when RM section is open and rmRows are available
  useEffect(() => {
    if (!sections.issueRM) return;
    rmRows.forEach((r) => { if (r.itemId) fetchBarcodesForItem(r.itemId); });
  }, [sections.issueRM, rmRows, fetchBarcodesForItem]);

  const toggleSection = useCallback((key: keyof SectionState) => {
    setSections((p) => ({ ...p, [key]: !p[key] }));
  }, []);

  // ── Row update helpers ──
  const updateFG = (idx: number, field: keyof FGActionRow, val: any) => {
    setFgRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = val;
      if (field === "quantityAdded") {
        next[idx].newQuantity = next[idx].completed + Number(val);
      }
      return next;
    });
  };

  const updateRM = (idx: number, field: keyof RMActionRow, val: any) => {
    setRmRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = val;
      // Recompute newQuantity on both quantity and addLess changes
      if (field === "quantity" || field === "addLess") {
        const row = next[idx];
        const qty = field === "quantity" ? Number(val) : row.quantity;
        const mode = field === "addLess" ? String(val) : row.addLess;
        // "Issue from ..." deducts; "Return to ..." and "Line Reject" add back to stock
        const sign = mode === "Issue from ..." ? -1 : 1;
        next[idx].newQuantity = row.currentStock + sign * qty;
      }
      return next;
    });
  };

  const updateRouting = (idx: number, field: keyof RoutingActionRow, val: any) => {
    setRoutingRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = val;
      if (field === "changeInFGQty") {
        next[idx].finalFGQty = next[idx].currentFGQty + Number(val);
      }
      return next;
    });
  };

  const updateScrap = (idx: number, field: keyof ScrapActionRow, val: any) => {
    setScrapRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = val;
      return next;
    });
  };

  const updateCharge = (idx: number, field: keyof OtherChargeActionRow, val: any) => {
    setChargeRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = val;
      return next;
    });
  };

  const handleSave = async () => {
    if (!onSaveChanges) { onClose(); return; }
    try {
      setSaving(true);
      await onSaveChanges({ fgRows, rmRows, routingRows, scrapRows, chargeRows, markTestedAndPassed });
      toast.success("Changes saved successfully!");
      onClose();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Filtered RM
  const filteredRM = rmRows.filter(
    (r) =>
      r.itemId.toLowerCase().includes(rmIdSearch.toLowerCase()) &&
      r.itemName.toLowerCase().includes(rmNameSearch.toLowerCase())
  );

  // Context FG for routing header
  const firstFG = fgRows[0];

  // Classification icon helper
  const ClassificationIcon = ({ name }: { name: string }) => {
    if (name === "Labour Charges") return <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
    if (name === "Machinery Charges") return <Factory className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
    if (name === "Electricity Charges") return <Zap className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
    return <Wrench className="h-3.5 w-3.5 text-gray-400 shrink-0" />;
  };

  // ─────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[96vw] w-[1240px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">

        {/* ── Header ── */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-amber-900" />
            </div>
            <DialogTitle className="text-base font-semibold text-gray-900">
              Take Actions for {processNumber}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto divide-y">

          {/* ════════════════════════════════
              1 — Mark FG Produced
          ════════════════════════════════ */}
          <Section
            title="Mark FG Produced"
            icon={<Package className="h-4 w-4 text-green-600" />}
            expanded={sections.markFGProduced}
            onToggle={() => toggleSection("markFGProduced")}
          >
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr>
                    <TH>ITEM ID</TH>
                    <TH>ITEM NAME</TH>
                    <TH>ITEM CATEGORY</TH>
                    <TH>UNIT</TH>
                    <TH>TARGET PRODUCTION</TH>
                    <TH>COMPLETED</TH>
                    <TH>TESTED</TH>
                    <TH>PASSED</TH>
                    <TH>REJECTED</TH>
                    <TH>STORE</TH>
                    <TH>QUANTITY ADDED</TH>
                    <TH>NEW QUANTITY</TH>
                    <TH>COMMENT</TH>
                  </tr>
                </thead>
                <tbody>
                  {fgRows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-400">No finished goods defined</td>
                    </tr>
                  ) : fgRows.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border-r text-blue-600 font-medium whitespace-nowrap">{row.itemId}</td>
                      <td className="px-3 py-2 border-r whitespace-nowrap">{row.itemName}</td>
                      <td className="px-3 py-2 border-r text-gray-400">{row.itemCategory}</td>
                      <td className="px-3 py-2 border-r text-blue-600 font-medium">{row.unit}</td>
                      {/* Target Production with → arrow */}
                      <td className="px-3 py-2 border-r">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={row.targetProduction}
                            onChange={(e) => updateFG(i, "targetProduction", Number(e.target.value))}
                            className="h-7 w-16 text-xs text-center"
                            min={0}
                          />
                          <span className="text-gray-400 text-xs">→</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r text-center font-medium">{row.completed}</td>
                      <td className="px-3 py-2 border-r text-center">{row.tested}</td>
                      <td className="px-3 py-2 border-r text-center">{row.passed}</td>
                      <td className="px-3 py-2 border-r text-center">{row.rejected}</td>
                      {/* Store dropdown */}
                      <td className="px-3 py-2 border-r min-w-[150px]">
                        <Select value={row.store} onValueChange={(v) => updateFG(i, "store", v)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue>{row.store}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Default Stock Store">Default Stock Store</SelectItem>
                            <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                            <SelectItem value="Secondary Warehouse">Secondary Warehouse</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      {/* Quantity Added — underline input */}
                      <td className="px-3 py-2 border-r w-24">
                        <UnderlineInput
                          value={row.quantityAdded}
                          onChange={(v) => updateFG(i, "quantityAdded", Number(v))}
                          className="w-20"
                        />
                      </td>
                      {/* New Quantity — computed, read-only */}
                      <td className="px-3 py-2 border-r text-center text-gray-500">
                        {Number(row.newQuantity).toFixed(5)}
                      </td>
                      {/* Comment */}
                      <td className="px-3 py-2">
                        <Input
                          value={row.comment}
                          onChange={(e) => updateFG(i, "comment", e.target.value)}
                          className="h-7 text-xs w-32"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mark Tested & Passed checkbox — right-aligned */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <input
                type="checkbox"
                id="mark-tested-passed"
                checked={markTestedAndPassed}
                onChange={(e) => setMarkTestedAndPassed(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              <label htmlFor="mark-tested-passed" className="text-xs font-medium text-gray-700 cursor-pointer select-none">
                Mark Items Tested & Passed
              </label>
            </div>
          </Section>

          {/* ════════════════════════════════
              2 — Issue Raw Materials
          ════════════════════════════════ */}
          <Section
            title="Issue Raw Materials"
            icon={<Package className="h-4 w-4 text-blue-600" />}
            expanded={sections.issueRM}
            onToggle={() => toggleSection("issueRM")}
          >
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs min-w-[1050px]">
                <thead>
                  <tr>
                    <TH className="w-8">#</TH>
                    <TH>ITEM ID</TH>
                    <TH>ITEM NAME</TH>
                    <TH className="text-right">CURRENT STOCK</TH>
                    <TH>
                      <div className="flex items-center gap-1">
                        ESTIMATED RM
                        <Zap className="h-3 w-3 text-blue-500" />
                        <span className="text-gray-400">→</span>
                      </div>
                    </TH>
                    <TH className="text-center">USED RM</TH>
                    <TH>UNIT</TH>
                    <TH>COMMENT</TH>
                    <TH>STORE</TH>
                    <TH>ADD/LESS</TH>
                    <TH className="text-center">QUANTITY</TH>
                    <TH className="text-center">NEW QUANTITY</TH>
                    <TH>BARCODE</TH>
                  </tr>
                  {/* Search row */}
                  <tr className="bg-white">
                    <td className="px-3 py-1.5 border-r border-b" />
                    <td className="px-3 py-1.5 border-r border-b">
                      <Input
                        placeholder="Search..."
                        value={rmIdSearch}
                        onChange={(e) => setRmIdSearch(e.target.value)}
                        className="h-6 text-xs border-0 border-b rounded-none shadow-none focus-visible:ring-0"
                      />
                    </td>
                    <td className="px-3 py-1.5 border-r border-b">
                      <Input
                        placeholder="Search..."
                        value={rmNameSearch}
                        onChange={(e) => setRmNameSearch(e.target.value)}
                        className="h-6 text-xs border-0 border-b rounded-none shadow-none focus-visible:ring-0"
                      />
                    </td>
                    <td colSpan={10} className="border-b" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRM.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-gray-400">No raw materials</td>
                    </tr>
                  ) : filteredRM.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-gray-50 ${
                        row.addLess === "Line Reject" ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-3 py-2 border-r text-gray-500 text-center">{i + 1}</td>
                      <td className="px-3 py-2 border-r text-blue-600 font-medium whitespace-nowrap">{row.itemId}</td>
                      <td className="px-3 py-2 border-r whitespace-nowrap">{row.itemName}</td>
                      {/* Current Stock — red if negative */}
                      <td className={`px-3 py-2 border-r text-right font-medium ${row.currentStock < 0 ? "text-red-600" : "text-gray-700"}`}>
                        {row.currentStock.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 border-r text-center text-blue-700 font-medium">{row.estimatedRM}</td>
                      <td className="px-3 py-2 border-r text-center">{row.usedRM}</td>
                      <td className="px-3 py-2 border-r text-blue-600 font-medium">{row.unit}</td>
                      {/* Comment */}
                      <td className="px-3 py-2 border-r">
                        <Input
                          value={row.comment}
                          onChange={(e) => updateRM(i, "comment", e.target.value)}
                          className="h-7 text-xs w-28"
                          placeholder="Comment"
                        />
                      </td>
                      {/* Store */}
                      <td className="px-3 py-2 border-r min-w-[130px]">
                        <Select value={row.store} onValueChange={(v) => updateRM(i, "store", v)}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue>{row.store.length > 12 ? row.store.slice(0, 12) + "..." : row.store}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Default Stock Store">Default Stock Store</SelectItem>
                            <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      {/* Add/Less — three options including Line Reject */}
                      <td className="px-3 py-2 border-r min-w-[140px]">
                        <Select
                          value={row.addLess}
                          onValueChange={(v) => updateRM(i, "addLess", v)}
                        >
                          <SelectTrigger
                            className={`h-7 text-xs ${
                              row.addLess === "Line Reject"
                                ? "border-red-300 text-red-700 bg-red-50"
                                : row.addLess === "Return to ..."
                                ? "border-amber-300 text-amber-700 bg-amber-50"
                                : ""
                            }`}
                          >
                            <SelectValue>
                              {row.addLess === "Line Reject" ? (
                                <span className="flex items-center gap-1">
                                  <XCircle className="h-3 w-3 shrink-0" />
                                  Line Reject
                                </span>
                              ) : (
                                row.addLess
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Issue from ...">Issue from ...</SelectItem>
                            <SelectItem value="Return to ...">Return to ...</SelectItem>
                            <SelectItem value="Line Reject">
                              <span className="flex items-center gap-1.5 text-red-600">
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                Line Reject
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      {/* Quantity — underline input */}
                      <td className="px-3 py-2 border-r">
                        <UnderlineInput
                          value={row.quantity}
                          onChange={(v) => updateRM(i, "quantity", Number(v))}
                          className="w-16 mx-auto"
                        />
                      </td>
                      {/* New Quantity — computed, red when Line Reject */}
                      <td className={`px-3 py-2 text-center font-medium ${
                        row.addLess === "Line Reject" ? "text-red-600" : "text-gray-500"
                      }`}>
                        {row.newQuantity || 0}
                      </td>
                      {/* Barcode select — only meaningful for "Issue from ..." */}
                      <td className="px-3 py-2 border-l min-w-[170px]">
                        <Select
                          value={row.barcodeId != null ? String(row.barcodeId) : "__none__"}
                          onValueChange={(v) => updateRM(i, "barcodeId", v === "__none__" ? null : Number(v))}
                          onOpenChange={(open) => { if (open) fetchBarcodesForItem(row.itemId); }}
                          disabled={row.addLess !== "Issue from ..."}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            {barcodeLoading[row.itemId]
                              ? <span className="flex items-center gap-1 text-gray-400"><Loader2 className="h-3 w-3 animate-spin" />Loading…</span>
                              : <SelectValue placeholder="Select barcode (opt.)" />
                            }
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {(itemBarcodes[row.itemId] ?? []).map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.barcodeNumber}
                                {b.quantity != null ? ` (qty: ${b.quantity})` : ""}
                              </SelectItem>
                            ))}
                            {(itemBarcodes[row.itemId] ?? []).length === 0 && !barcodeLoading[row.itemId] && itemBarcodes[row.itemId] !== undefined && (
                              <div className="px-3 py-2 text-xs text-gray-400">No barcodes found</div>
                            )}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination footer */}
              <div className="flex items-center justify-end gap-3 px-4 py-2 border-t bg-gray-50 text-xs text-gray-600">
                <span>Rows per page:</span>
                <select className="border rounded px-1 py-0.5 text-xs bg-white">
                  <option>10</option><option>25</option><option>50</option>
                </select>
                <span>1–{filteredRM.length} of {filteredRM.length}</span>
                <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>◀</button>
                <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>▶</button>
              </div>
            </div>
          </Section>

          {/* ════════════════════════════════
              3 — Mark Scrap Generated
          ════════════════════════════════ */}
          <Section
            title="Mark Scrap Generated"
            icon={<Trash2 className="h-4 w-4 text-orange-600" />}
            expanded={sections.markScrap}
            onToggle={() => toggleSection("markScrap")}
          >
            {scrapRows.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm border rounded-lg">No scrap items defined</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs min-w-[750px]">
                  <thead>
                    <tr>
                      <TH className="w-8">#</TH>
                      <TH>ITEM ID</TH>
                      <TH>ITEM NAME</TH>
                      <TH>UNIT</TH>
                      <TH className="text-center">EST. QUANTITY</TH>
                      <TH className="text-center">ACTUAL QUANTITY</TH>
                      <TH className="text-center">COST ALLOC</TH>
                      <TH>STORE</TH>
                      <TH>COMMENT</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {scrapRows.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 border-r text-gray-500 text-center">{i + 1}</td>
                        <td className="px-3 py-2 border-r text-blue-600 font-medium">{row.itemId}</td>
                        <td className="px-3 py-2 border-r">{row.itemName}</td>
                        <td className="px-3 py-2 border-r text-blue-600 font-medium">{row.unit}</td>
                        <td className="px-3 py-2 border-r text-center font-medium">{row.estimatedQty}</td>
                        <td className="px-3 py-2 border-r">
                          <UnderlineInput
                            value={row.actualQty}
                            onChange={(v) => updateScrap(i, "actualQty", Number(v))}
                            className="w-20 mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2 border-r">
                          <Input
                            type="number"
                            value={row.costAlloc}
                            onChange={(e) => updateScrap(i, "costAlloc", Number(e.target.value))}
                            className="h-7 w-16 text-xs text-center mx-auto"
                            min={0}
                          />
                        </td>
                        <td className="px-3 py-2 border-r min-w-[130px]">
                          <Select value={row.store} onValueChange={(v) => updateScrap(i, "store", v)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue>{row.store.length > 12 ? row.store.slice(0, 12) + "..." : row.store}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Default Stock Store">Default Stock Store</SelectItem>
                              <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={row.comment}
                            onChange={(e) => updateScrap(i, "comment", e.target.value)}
                            className="h-7 text-xs w-32"
                            placeholder="Comment"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ════════════════════════════════
              4 — Log Routing Data
          ════════════════════════════════ */}
          <Section
            title="Log Routing Data"
            icon={<GitBranch className="h-4 w-4 text-purple-600" />}
            expanded={sections.logRoutingData}
            onToggle={() => toggleSection("logRoutingData")}
          >
            {/* FG context */}
            {firstFG && (
              <div className="mb-3 text-xs text-gray-600 leading-5 border-l-4 border-blue-300 pl-3 bg-blue-50 py-2 rounded-r">
                <div>
                  <span className="font-semibold">FG :</span>{" "}
                  {firstFG.itemName} ({firstFG.itemId})
                </div>
                <div>
                  <span className="font-semibold">Target Production :</span>{" "}
                  {firstFG.targetProduction} {firstFG.unit}
                </div>
              </div>
            )}

            {routingRows.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm border rounded-lg">No routing steps defined</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs min-w-[900px]">
                  <thead>
                    <tr>
                      <TH>Id</TH>
                      <TH>Name</TH>
                      <TH className="text-center">Current FG quantity</TH>
                      <TH className="text-center">Change in FG quantity</TH>
                      <TH className="text-center">Final FG quantity</TH>
                      <TH className="text-center">Completion %</TH>
                      <TH>Comment</TH>
                      <TH className="text-center">Mark Done</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {routingRows.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 border-r font-medium whitespace-nowrap">{row.routingNumber}</td>
                        <td className="px-3 py-2 border-r whitespace-nowrap">{row.routingName}</td>
                        <td className="px-3 py-2 border-r text-center">{row.currentFGQty}</td>
                        {/* Change in FG quantity — editable */}
                        <td className="px-3 py-2 border-r">
                          <UnderlineInput
                            value={row.changeInFGQty}
                            onChange={(v) => updateRouting(i, "changeInFGQty", Number(v))}
                            className="w-20 mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2 border-r text-center">{row.finalFGQty}</td>
                        {/* Completion % — editable */}
                        <td className="px-3 py-2 border-r">
                          <div className="flex items-center justify-center gap-0.5">
                            <UnderlineInput
                              value={row.completionPercent}
                              onChange={(v) => updateRouting(i, "completionPercent", Number(v))}
                              className="w-12"
                            />
                            <span className="text-gray-500 text-xs shrink-0">%</span>
                          </div>
                        </td>
                        {/* Comment — long placeholder matching screenshot */}
                        <td className="px-3 py-2 border-r">
                          <Input
                            value={row.comment}
                            onChange={(e) => updateRouting(i, "comment", e.target.value)}
                            className="h-7 text-xs w-56"
                            placeholder="Example Heating, cooling, extruding, m..."
                          />
                        </td>
                        {/* Mark Done checkbox */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.markDone}
                            onChange={(e) => updateRouting(i, "markDone", e.target.checked)}
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ════════════════════════════════
              5 — Log Other Charges
          ════════════════════════════════ */}
          <Section
            title="Log Other Charges"
            icon={<DollarSign className="h-4 w-4 text-teal-600" />}
            expanded={sections.logOtherCharges}
            onToggle={() => toggleSection("logOtherCharges")}
          >
            {chargeRows.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm border rounded-lg">No charges defined</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <TH>Classification</TH>
                      <TH className="text-right">Estimated Amount</TH>
                      <TH>Actual Amount</TH>
                      <TH>Comment</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {chargeRows.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 border-r">
                          <div className="flex items-center gap-2">
                            <ClassificationIcon name={row.classification} />
                            <span className="font-medium">{row.classification}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r text-right font-medium text-gray-700">
                          {row.estimatedAmount}
                        </td>
                        <td className="px-4 py-3 border-r">
                          <UnderlineInput
                            value={row.actualAmount}
                            onChange={(v) => updateCharge(i, "actualAmount", Number(v))}
                            className="w-28"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={row.comment}
                            onChange={(e) => updateCharge(i, "comment", e.target.value)}
                            className="h-7 text-xs w-full"
                            placeholder="Comment"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        {/* ── Footer ── */}
        <div className="border-t bg-white px-6 py-3 flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#105076] hover:bg-[#0d4566] text-white font-semibold px-6"
          >
            {saving
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TakeActionsDialog;
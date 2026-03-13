// src/pages/production/process-details.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Trash2, ChevronDown, ChevronUp, Package, GitBranch,
  DollarSign, Loader2, Eye, EyeOff, Calendar, CheckCircle,
  AlertCircle, Users, Factory, Zap, Wrench, Save, Plus, Search,
  Warehouse, MapPin, Edit3, Play, XCircle,  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { productionAPI, type TakeActionPayload, type FGTestPayload } from "@/services/productionService";
import { routingAPI, type Routing } from "@/services/routingService";
import { get } from "@/lib/apiService";

// ── New components ──
import TakeActionsDialog, { type TakeActionSection } from "@/components/ui/takeActionDialogue";
import StoreIssueApprovalDialog, {
  type ApprovalRow,
  type StoreIssueApprovalMeta,
} from "@/components/ui/storeIssueApprove";
import FGTestingSidebar, { type FGTestingData } from "@/components/ui/fgTestingsidebar";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ProductionStatus =
  | "planned"
  | "publish"
  | "in_progress"
  | "complete"
  | "cancelled";

interface ProcessDetailsType {
  processNumber: string;
  orderDeliveryDate: string;
  expectedCompletionDate: string;
  status: ProductionStatus;
  stage: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  fgStore: { name: string; address1?: string; city: string; postalCode: string; id: number };
  rmStore: { name: string; address1?: string; city: string; postalCode: string; id: number };
  scrapStore: { name: string; address1?: string; city: string; postalCode: string; id: number };
  description: string;
  comments: string;
  bomId: number;
}

interface Item {
  id: string; name: string; sku: string; unit?: any; category?: any;
  currentStock: string; defaultPrice: string; hsnCode: string;
  minimumStockLevel: string; maximumStockLevel: string;
  regularBuyingPrice?: string; regularSellingPrice?: string;
}

interface FinishedGood {
  id: number; req_quantity: number; total_mfg_quantity: number;
  tested_quantity: number; accept_quantity: number; reject_quantity: number;
  actual_used_quantity: number; comment: string | null; itemName?: string;
  itemData?: Item; bomFinishedGoodsId: number; unit?: string;
  costAlloc?: number; forRepair?: number; repaired?: number;
}

interface RawMaterial {
  id: number; req_quantity: number; actual_used_quantity: number;
  tested_quantity: number; comment: string | null; itemName?: string;
  itemData?: Item; bomRawMaterialId: number; currentStock?: string;
  estimatedProduction?: number; produced?: number; unit?: string;
}

interface Scrap {
  id: number; quantity: number; actual_quantity: number; cost_alloc: number;
  comment: string | null; itemName?: string; itemData?: Item;
  bomScrapId: number; unit?: string;
}

interface OtherCharge {
  id: number; charges_estimate: number; comment: string | null;
  bomOtherChargeId: number;
  bomOtherCharge?: { id: number; classification: string; charges: number };
}

interface RoutingItem {
  routingId?: number;
  /** Production routing record ID — used as API "id" key in take-action */
  productionRoutingId?: number;
  routingNumber?: string; routingName?: string;
  is_done?: boolean; quantity_completed?: number; comment?: string; createdAt?: string;
}

interface ProcessLevelData {
  expanded: { finishedGoods: boolean; rawMaterials: boolean; routing: boolean; scrap: boolean; otherCharges: boolean };
  id: number; bomItemId: number;
  finishedGoods: FinishedGood[]; rawMaterials: RawMaterial[];
  routing: RoutingItem[]; scrap: Scrap[]; otherCharges: OtherCharge[];
}

interface ItemsAPIResponse { status: boolean; message: string; data: Item[] }

interface CostBreakdown {
  totalRawMaterialCost: number; totalFinishedGoodsCost: number;
  totalScrapCost: number; totalOtherCharges: number; grandTotal: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const calculateItemPrice = (item: any): number =>
  parseFloat(item?.defaultPrice || item?.regularBuyingPrice || item?.regularSellingPrice || item?.mrp || "0") || 0;

const calculateCostsForLevel = (level: ProcessLevelData): CostBreakdown => {
  let rm = 0, fg = 0, sc = 0, oc = 0;
  level.rawMaterials.forEach((r) => { rm += calculateItemPrice(r.itemData) * (r.req_quantity || 0); });
  level.finishedGoods.forEach((f) => { fg += calculateItemPrice(f.itemData) * (f.req_quantity || 0); });
  level.scrap.forEach((s) => { sc += calculateItemPrice(s.itemData) * (s.quantity || 0); });
  level.otherCharges.forEach((o) => { oc += o.charges_estimate || 0; });
  return { totalRawMaterialCost: rm, totalFinishedGoodsCost: fg, totalScrapCost: sc, totalOtherCharges: oc, grandTotal: rm + fg + sc + oc };
};

// ─────────────────────────────────────────────────────────────────────────────
// normaliseResponse
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Our productionAPI methods may return the parsed response body directly
 * OR an Axios-style wrapper where the body is nested under `.data`.
 *
 * Rule: if the value already carries a boolean `status` field it IS the body.
 * Otherwise unwrap one level via `.data`.
 *
 * Examples
 *   { status: true,  message: "...", data: {...} }  → returned as-is
 *   { data: { status: true, message: "...", data: {...} }, headers: ... } → returns inner data
 */
const normaliseResponse = (raw: unknown): any => {
  if (raw !== null && typeof raw === "object") {
    // If the object itself has a boolean `status` it is already the API body
    if (typeof (raw as any).status === "boolean") return raw;
    // Otherwise try to unwrap one level
    if ((raw as any).data !== undefined) return (raw as any).data;
  }
  return raw;
};

/** Build StoreIssueApproval rows from TakeActions save data */
const buildApprovalRows = (
  section: TakeActionSection,
  saveData: {
    fgRows: any[]; rmRows: any[]; routingRows: any[];
    scrapRows: any[]; chargeRows: any[]; markTestedAndPassed: boolean;
  }
): { rows: ApprovalRow[]; docType: string; docAction: string } => {

  if (section === "issueRM") {
    const changed = saveData.rmRows.filter((r) => (r.quantity || 0) > 0);
    return {
      docType: "Process RM",
      docAction: "Document Created",
      rows: changed.map((r, i) => ({
        seq: i + 1,
        itemId: r.itemId,
        description: r.itemName,
        productCategory: "—",
        action: r.addLess === "Return to ..." ? "Return to Store" : "Issue from Store",
        fromStore: r.store,
        toStore: "—",
        documentQuantity: r.quantity,
        approvedQuantity: r.quantity,
        unit: r.unit,
        baseQuantity: r.quantity,
        baseUnit: r.unit,
        currentStock: r.currentStock ?? 0,
        comment: r.comment || "",
      })),
    };
  }

  if (section === "markFGProduced") {
    const changed = saveData.fgRows.filter((r) => (r.quantityAdded || 0) > 0);
    return {
      docType: "Process FG",
      docAction: "Document Created",
      rows: changed.map((r, i) => ({
        seq: i + 1,
        itemId: r.itemId,
        description: r.itemName,
        productCategory: "Semi-finished Goods",
        action: "Add to Store",
        fromStore: "—",
        toStore: r.store,
        documentQuantity: r.quantityAdded,
        approvedQuantity: r.quantityAdded,
        unit: r.unit,
        baseQuantity: r.quantityAdded,
        baseUnit: r.unit,
        currentStock: r.newQuantity ?? 0,
        comment: r.comment || "",
        // barcode fields: fgId = production record id, rawItemId = real inventory item id
        rawItemId: r.inventoryItemId ?? r.itemId,
      })),
    };
  }

  if (section === "markScrap") {
    const changed = saveData.scrapRows.filter((r) => (r.actualQty || 0) > 0);
    return {
      docType: "Process Scrap",
      docAction: "Document Created",
      rows: changed.map((r, i) => ({
        seq: i + 1,
        itemId: r.itemId,
        description: r.itemName,
        productCategory: "—",
        action: "Add to Store",
        fromStore: "—",
        toStore: r.store,
        documentQuantity: r.actualQty,
        approvedQuantity: r.actualQty,
        unit: r.unit,
        baseQuantity: r.actualQty,
        baseUnit: r.unit,
        currentStock: 0,
        comment: r.comment || "",
      })),
    };
  }

  if (section === "logRoutingData") {
    const changed = saveData.routingRows.filter((r) => (r.changeInFGQty || 0) > 0);
    return {
      docType: "Process Routing",
      docAction: "Document Created",
      rows: changed.map((r, i) => ({
        seq: i + 1,
        itemId: r.routingId?.toString() || "—",
        description: `${r.routingNumber} — ${r.routingName}`,
        productCategory: "—",
        action: r.markDone ? "Mark Done" : "Log Progress",
        fromStore: "—",
        toStore: "—",
        documentQuantity: r.changeInFGQty,
        approvedQuantity: r.changeInFGQty,
        unit: "NOS",
        baseQuantity: r.finalFGQty,
        baseUnit: "NOS",
        currentStock: r.currentFGQty,
        comment: r.comment || "",
      })),
    };
  }

  if (section === "logOtherCharges") {
    const changed = saveData.chargeRows.filter((r) => (r.actualAmount || 0) > 0);
    return {
      docType: "Process Other Charges",
      docAction: "Document Created",
      rows: changed.map((r, i) => ({
        seq: i + 1,
        itemId: r.bomOtherChargeId?.toString() || "—",
        description: r.classification,
        productCategory: "—",
        action: "Log Charge",
        fromStore: "—",
        toStore: "—",
        documentQuantity: r.estimatedAmount,
        approvedQuantity: r.actualAmount,
        unit: "₹",
        baseQuantity: r.actualAmount,
        baseUnit: "₹",
        currentStock: 0,
        comment: r.comment || "",
      })),
    };
  }

  return { docType: "Process", docAction: "Document Created", rows: [] };
};

// ─────────────────────────────────────────────────────────────────────────────
// ItemSelect
// ─────────────────────────────────────────────────────────────────────────────
const ItemSelect: React.FC<{
  value: string; onValueChange: (i?: Item) => void;
  items: Item[]; placeholder?: string; disabled?: boolean; compact?: boolean;
}> = ({ value, onValueChange, items, placeholder = "Select item", disabled = false, compact = false }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const selected = useMemo(() => items.find((i) => i.id === value), [items, value]);
  return (
    <Select value={value} onValueChange={(val) => onValueChange(items.find((i) => i.id === val))} disabled={disabled || items.length === 0}>
      <SelectTrigger className={`h-9 ${compact ? "w-[180px]" : "w-[220px]"}`}>
        <SelectValue placeholder={placeholder}>
          {selected
            ? <div className="flex flex-col text-left truncate"><span className="font-medium text-xs truncate">{selected.name}</span><span className="text-xs text-gray-500 truncate">SKU: {selected.sku}</span></div>
            : <span className="text-gray-500 text-xs">{placeholder}</span>}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="sticky top-0 z-50 bg-white p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
        {filtered.length === 0
          ? <div className="py-6 text-center text-gray-500 text-sm">No items found</div>
          : filtered.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <div className="flex flex-col">
                <span className="font-medium truncate">{item.name}</span>
                <span className="text-xs text-gray-500">SKU: {item.sku} | ₹{calculateItemPrice(item).toLocaleString("en-IN")}</span>
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RoutingDialog (unchanged from before)
// ─────────────────────────────────────────────────────────────────────────────
const RoutingDialog: React.FC<{
  onSelect: (r: Routing, comment: string) => void;
  levelIndex: number; existingRoutingIds?: number[];
}> = ({ onSelect, levelIndex, existingRoutingIds = [] }) => {
  const [routings, setRoutings] = useState<Routing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouting, setSelectedRouting] = useState<Routing | null>(null);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRouting, setNewRouting] = useState({ number: "", name: "", desc: "" });
  const [creating, setCreating] = useState(false);

  const fetchRoutings = async () => {
    try {
      setLoading(true); setError(null);
      const res = await routingAPI.getAllRoutings();
      if (res?.status && Array.isArray(res.data)) { setRoutings(res.data); setHasFetched(true); }
      else setError("Invalid routing data");
    } catch (e) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (open && !hasFetched) fetchRoutings();
    if (!open) { setSelectedRouting(null); setComment(""); setShowNewForm(false); setNewRouting({ number: "", name: "", desc: "" }); }
  }, [open, hasFetched]);

  const handleCreate = async () => {
    if (!newRouting.number || !newRouting.name) { toast.error("Fill required fields"); return; }
    try {
      setCreating(true);
      const res = await routingAPI.createRouting(newRouting);
      if (res?.status) { setRoutings((p) => [...p, res.data]); setSelectedRouting(res.data); setShowNewForm(false); toast.success("Routing created!"); }
      else toast.error("Failed to create routing");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unknown"); }
    finally { setCreating(false); }
  };

  const available = useMemo(() => routings.filter((r) => !existingRoutingIds.includes(r.id)), [routings, existingRoutingIds]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg"><Plus className="h-5 w-5 mr-2" /> Add Routing / Work Center</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Routing for Level {levelIndex + 1}</DialogTitle>
          <DialogDescription>Choose an existing routing or create a new one</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {showNewForm ? (
            <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
              <h3 className="font-semibold text-lg">Create New Routing</h3>
              <div><Label>Routing Number *</Label><Input value={newRouting.number} onChange={(e) => setNewRouting({ ...newRouting, number: e.target.value })} className="mt-1" /></div>
              <div><Label>Routing Name *</Label><Input value={newRouting.name} onChange={(e) => setNewRouting({ ...newRouting, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={newRouting.desc} onChange={(e) => setNewRouting({ ...newRouting, desc: e.target.value })} className="mt-1" rows={3} /></div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={creating} className="flex-1">{creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Create</Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => { setShowNewForm(true); setSelectedRouting(null); }} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />Create New Routing</Button>
          )}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Available Routings</h3>
              <Button variant="ghost" size="sm" onClick={fetchRoutings} disabled={loading} className="h-8 w-8 p-0"><Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
            </div>
            {loading ? <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
              : error ? <div className="p-8 text-center text-red-600">{error}</div>
              : available.length === 0 ? <div className="p-8 text-center text-gray-500">No routings available</div>
              : <div className="max-h-64 overflow-y-auto divide-y">
                {available.map((r) => (
                  <div key={r.id} onClick={() => { setSelectedRouting(r); setShowNewForm(false); }} className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${selectedRouting?.id === r.id ? "bg-blue-50" : ""}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedRouting?.id === r.id ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>{selectedRouting?.id === r.id && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                    <div><p className="font-semibold text-sm">{r.number}</p><p className="text-xs text-gray-600">{r.name}</p></div>
                  </div>
                ))}
              </div>}
          </div>
          {selectedRouting && <div><Label>Comment</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1" /></div>}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { if (!selectedRouting) { toast.error("Select a routing"); return; } onSelect(selectedRouting, comment); setOpen(false); }} disabled={!selectedRouting} className="bg-[#105076] hover:bg-[#0d4566]">
              {selectedRouting ? `Select "${selectedRouting.number}"` : "Select Routing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ProcessLevel
// ─────────────────────────────────────────────────────────────────────────────
interface ProcessLevelProps {
  levelIndex: number; data: ProcessLevelData; items: Item[];
  isEditMode: boolean; processStatus: string;
  onUpdateLevel: (i: number, d: ProcessLevelData) => void;
  onAddRow: (i: number, t: "rm" | "scrap") => void;
  onRemoveRow: (i: number, t: "rm" | "scrap", j: number) => void;
  onUpdateItemSelection: (i: number, t: "fg" | "rm" | "scrap", j: number, d?: Item) => void;
  onAddRouting: (i: number, r: Routing, c: string) => void;
  onRemoveRouting: (i: number, j: number) => void;
  showCost?: boolean;
  onOpenTakeActions: (s: TakeActionSection) => void;
  /** Opens FG Testing sidebar */
  onOpenFGTesting: () => void;
}

const ProcessLevel: React.FC<ProcessLevelProps> = React.memo(({
  levelIndex, data, items, isEditMode, processStatus,
  onUpdateLevel, onAddRow, onRemoveRow, onUpdateItemSelection,
  onAddRouting, onRemoveRouting, showCost = false,
  onOpenTakeActions, onOpenFGTesting,
}) => {
  const toggle = useCallback((s: keyof ProcessLevelData["expanded"]) => {
    onUpdateLevel(levelIndex, { ...data, expanded: { ...data.expanded, [s]: !data.expanded[s] } });
  }, [data, levelIndex, onUpdateLevel]);

  const editable = isEditMode && !["complete", "cancelled"].includes(processStatus);
  // Action buttons (Mark FG, Issue RM, etc.) are visible in Pending and WIP states
  const canTakeAction = ["publish", "in_progress"].includes(processStatus);
  const costs = useMemo(() => calculateCostsForLevel(data), [data]);
  const existingRoutingIds = useMemo(() => data.routing.map((r) => r.routingId).filter(Boolean) as number[], [data.routing]);

  // ── input handlers ──
  const handleFGChange = useCallback((idx: number, field: keyof FinishedGood, value: string | number) => {
    const arr = [...data.finishedGoods]; if (!arr[idx]) return;
    let v = typeof value === "string" ? parseFloat(value) || 0 : value;
    if (v < 0) v = 0;
    if ((field === "total_mfg_quantity" || field === "accept_quantity") && v > arr[idx].req_quantity) { toast.error(`Cannot exceed target quantity of ${arr[idx].req_quantity}`); return; }
    if (field === "total_mfg_quantity" && v > 0) arr[idx].accept_quantity = v;
    (arr[idx] as any)[field] = v;
    onUpdateLevel(levelIndex, { ...data, finishedGoods: arr });
  }, [data, levelIndex, onUpdateLevel]);

  const handleRMChange = useCallback((idx: number, field: keyof RawMaterial, value: string | number) => {
    const arr = [...data.rawMaterials]; if (!arr[idx]) return;
    let v = typeof value === "string" ? parseFloat(value) || 0 : value;
    if (v < 0) v = 0;
    if (field === "actual_used_quantity") {
      const stock = parseFloat(arr[idx].currentStock || "0");
      if (v > stock) { toast.error(`Cannot exceed current stock of ${stock}`); return; }
    }
    (arr[idx] as any)[field] = v;
    onUpdateLevel(levelIndex, { ...data, rawMaterials: arr });
  }, [data, levelIndex, onUpdateLevel]);

  const handleScrapChange = useCallback((idx: number, field: keyof Scrap, value: string | number) => {
    const arr = [...data.scrap]; if (!arr[idx]) return;
    let v = typeof value === "string" ? parseFloat(value) || 0 : value;
    if (v < 0) v = 0;
    (arr[idx] as any)[field] = v;
    onUpdateLevel(levelIndex, { ...data, scrap: arr });
  }, [data, levelIndex, onUpdateLevel]);

  const handleChargeChange = useCallback((idx: number, field: keyof OtherCharge, value: string | number) => {
    const arr = [...data.otherCharges]; if (!arr[idx]) return;
    let v = typeof value === "string" ? parseFloat(value) || 0 : value;
    if (v < 0) v = 0;
    (arr[idx] as any)[field] = v;
    onUpdateLevel(levelIndex, { ...data, otherCharges: arr });
  }, [data, levelIndex, onUpdateLevel]);

  const handleRoutingChange = useCallback((idx: number, field: keyof RoutingItem, value: string | number | boolean) => {
    const arr = [...data.routing]; if (!arr[idx]) return;
    if (field === "quantity_completed") {
      let v = typeof value === "string" ? parseFloat(value) || 0 : value as number;
      if (v < 0) v = 0;
      (arr[idx] as any)[field] = v;
    } else { (arr[idx] as any)[field] = value; }
    onUpdateLevel(levelIndex, { ...data, routing: arr });
  }, [data, levelIndex, onUpdateLevel]);

  const getPrice = useCallback((item?: Item) => item ? calculateItemPrice(item) : 0, []);

  // ── Section header component (inner) ──
  const SectionHeader = ({
    sectionKey, label, icon, actionLabel, actionColor, actionSection,
    extraButton,
  }: {
    sectionKey: keyof ProcessLevelData["expanded"]; label: string;
    icon: React.ReactNode; actionLabel: string; actionColor: string;
    actionSection: TakeActionSection;
    extraButton?: React.ReactNode;
  }) => (
    <div
      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b"
      onClick={() => toggle(sectionKey)}
    >
      <h3 className="text-base font-semibold flex items-center gap-2 text-[#105076]">
        {icon} {label}
        {showCost && sectionKey === "finishedGoods" && <span className="ml-2 text-sm font-normal text-gray-600">(₹{costs.totalFinishedGoodsCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>}
        {showCost && sectionKey === "rawMaterials" && <span className="ml-2 text-sm font-normal text-gray-600">(₹{costs.totalRawMaterialCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>}
        {showCost && sectionKey === "scrap" && <span className="ml-2 text-sm font-normal text-gray-600">(₹{costs.totalScrapCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>}
        {showCost && sectionKey === "otherCharges" && <span className="ml-2 text-sm font-normal text-gray-600">(₹{costs.totalOtherCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>}
      </h3>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {extraButton}
        {canTakeAction && (
          <Button size="sm" className={`${actionColor} h-8 text-xs font-semibold`} onClick={() => onOpenTakeActions(actionSection)}>
            ✦ {actionLabel}
          </Button>
        )}
        {data.expanded[sectionKey] ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
    </div>
  );

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white mt-8 first:mt-0 shadow-sm">
      {/* Level header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#105076] text-white rounded-t-lg">
        <h2 className="text-xl font-bold">Process Level</h2>
        {showCost && <div className="bg-white/20 px-3 py-1 rounded text-sm">Total: ₹{costs.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>}
      </div>

      {/* ══ Finished Goods ══ */}
      <SectionHeader
        sectionKey="finishedGoods" label="Finished Goods"
        icon={<Package className="h-5 w-5 text-green-600" />}
        actionLabel="Mark FG Produced" actionColor="bg-green-600 hover:bg-green-700 text-white"
        actionSection="markFGProduced"
        extraButton={
          canTakeAction ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold border-[#105076] text-[#105076] hover:bg-[#105076] hover:text-white"
              onClick={onOpenFGTesting}
            >
              <FlaskConical className="h-3.5 w-3.5 mr-1" />
              FG Testing
            </Button>
          ) : undefined
        }
      />
      {data.expanded.finishedGoods && (
        <div className="p-6 border-b bg-gray-50">
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className={`grid ${showCost ? "grid-cols-14" : "grid-cols-13"} text-xs font-medium text-gray-600 bg-gray-100 border-b`}>
                {["#", "ITEM NAME", "UNIT", "COST ALLOC (%)", "TARGET PROD.", "COMPLETED", "TESTED", "ACCEPTED", "PASSED", "REJECTED", "FOR REPAIR", "REPAIRED", "COMMENT", ...(showCost ? ["TOTAL COST"] : []), ...(editable ? ["Actions"] : [])].map((h) => (
                  <div key={h} className="px-3 py-2 text-center">{h}</div>
                ))}
              </div>
              {data.finishedGoods.map((fg, idx) => {
                const cost = getPrice(fg.itemData) * (fg.req_quantity || 0);
                return (
                  <div key={`fg-${levelIndex}-${fg.id}`} className={`grid ${showCost ? "grid-cols-14" : "grid-cols-13"} border-b hover:bg-gray-50 text-xs items-center`}>
                    <div className="px-3 py-2 text-gray-500 text-center">{idx + 1}</div>
                    <div className="px-3 py-2">
                      {editable ? <ItemSelect value={fg.itemData?.id || ""} onValueChange={(d) => onUpdateItemSelection(levelIndex, "fg", idx, d)} items={items} compact /> : <span className="truncate">{fg.itemName || "Finished Good"}</span>}
                    </div>
                    <div className="px-3 py-2 text-center">{fg.unit || "Kg"}</div>
                    <div className="px-3 py-2"><Input type="number" value={fg.costAlloc || 0} onChange={(e) => handleFGChange(idx, "costAlloc", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.req_quantity} onChange={(e) => handleFGChange(idx, "req_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.total_mfg_quantity} onChange={(e) => handleFGChange(idx, "total_mfg_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.tested_quantity} onChange={(e) => handleFGChange(idx, "tested_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.accept_quantity} onChange={(e) => handleFGChange(idx, "accept_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.accept_quantity} onChange={(e) => handleFGChange(idx, "accept_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.reject_quantity} onChange={(e) => handleFGChange(idx, "reject_quantity", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.forRepair || 0} onChange={(e) => handleFGChange(idx, "forRepair", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={fg.repaired || 0} onChange={(e) => handleFGChange(idx, "repaired", parseFloat(e.target.value) || 0)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input value={fg.comment || ""} onChange={(e) => handleFGChange(idx, "comment", e.target.value)} disabled={!editable} className="h-8 w-full text-xs" placeholder="Comment" /></div>
                    {showCost && <div className="px-3 py-2 text-center font-medium text-green-700">₹{cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>}
                    {editable && <div className="px-3 py-2 flex justify-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.error("Finished goods defined by BOM cannot be removed")}><Trash2 className="h-4 w-4 text-gray-400" /></Button></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ Raw Materials ══ */}
      <SectionHeader
        sectionKey="rawMaterials" label="Raw Materials"
        icon={<Package className="h-5 w-5 text-blue-600" />}
        actionLabel="Issue" actionColor="bg-[#105076] hover:bg-[#0d4566] text-white"
        actionSection="issueRM"
      />
      {data.expanded.rawMaterials && (
        <div className="p-6 border-b bg-gray-50">
          {editable && <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => onAddRow(levelIndex, "rm")}><Plus className="h-4 w-4 mr-2" />Add Row</Button></div>}
          <div className="overflow-x-auto">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className={`grid ${showCost ? "grid-cols-12" : "grid-cols-11"} text-xs font-medium text-gray-600 bg-gray-100 border-b`}>
                {["#", "ITEM NAME", "CURRENT STOCK", "REQ. QTY", "USED", "TESTED", "EST. PROD.", "PRODUCED", "UNIT", "COMMENT", ...(showCost ? ["TOTAL COST"] : []), ...(editable ? ["Actions"] : [])].map((h) => (
                  <div key={h} className="px-3 py-2 text-center">{h}</div>
                ))}
              </div>
              {data.rawMaterials.map((rm, idx) => {
                const cost = getPrice(rm.itemData) * (rm.req_quantity || 0);
                return (
                  <div key={`rm-${levelIndex}-${rm.id}`} className={`grid ${showCost ? "grid-cols-12" : "grid-cols-11"} border-b hover:bg-gray-50 text-xs items-center`}>
                    <div className="px-3 py-2 text-gray-500 text-center">{idx + 1}</div>
                    <div className="px-3 py-2">{editable ? <ItemSelect value={rm.itemData?.id || ""} onValueChange={(d) => onUpdateItemSelection(levelIndex, "rm", idx, d)} items={items} compact /> : <span className="truncate">{rm.itemName || "Raw Material"}</span>}</div>
                    <div className="px-3 py-2 text-center">{rm.currentStock || "0"}</div>
                    <div className="px-3 py-2"><Input type="number" value={rm.req_quantity} onChange={(e) => handleRMChange(idx, "req_quantity", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={rm.actual_used_quantity} onChange={(e) => handleRMChange(idx, "actual_used_quantity", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={rm.tested_quantity} onChange={(e) => handleRMChange(idx, "tested_quantity", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={rm.estimatedProduction || 0} onChange={(e) => handleRMChange(idx, "estimatedProduction", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2"><Input type="number" value={rm.produced || 0} onChange={(e) => handleRMChange(idx, "produced", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                    <div className="px-3 py-2 text-center">{rm.unit || "Kg"}</div>
                    <div className="px-3 py-2"><Input value={rm.comment || ""} onChange={(e) => handleRMChange(idx, "comment", e.target.value)} disabled={!editable} className="h-8 w-full text-xs" placeholder="Comment" /></div>
                    {showCost && <div className="px-3 py-2 text-center font-medium text-blue-700">₹{cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>}
                    {editable && <div className="px-3 py-2 flex justify-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveRow(levelIndex, "rm", idx)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ Scrap ══ */}
      <SectionHeader
        sectionKey="scrap" label="Scrap Materials"
        icon={<Trash2 className="h-5 w-5 text-orange-600" />}
        actionLabel="Mark Scrap Generated" actionColor="bg-orange-500 hover:bg-orange-600 text-white"
        actionSection="markScrap"
      />
      {data.expanded.scrap && (
        <div className="p-6 border-b bg-gray-50">
          {editable && <div className="mb-4 flex justify-end"><Button size="sm" onClick={() => onAddRow(levelIndex, "scrap")}><Plus className="h-4 w-4 mr-2" />Add Row</Button></div>}
          {data.scrap.length === 0
            ? <div className="text-center py-8 text-gray-500">No scrap items defined</div>
            : (
              <div className="overflow-x-auto">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className={`grid ${showCost ? "grid-cols-10" : "grid-cols-9"} text-xs font-medium text-gray-600 bg-gray-100 border-b`}>
                    {["#", "ITEM NAME", "EST. QTY", "ACTUAL QTY", "UNIT", "COST ALLOC", "COMMENT", ...(showCost ? ["TOTAL COST"] : []), ...(editable ? ["Actions"] : [])].map((h) => (
                      <div key={h} className="px-3 py-2 text-center">{h}</div>
                    ))}
                  </div>
                  {data.scrap.map((sc, idx) => {
                    const cost = getPrice(sc.itemData) * (sc.quantity || 0);
                    return (
                      <div key={`sc-${levelIndex}-${sc.id}`} className={`grid ${showCost ? "grid-cols-10" : "grid-cols-9"} border-b hover:bg-gray-50 text-xs items-center`}>
                        <div className="px-3 py-2 text-gray-500 text-center">{idx + 1}</div>
                        <div className="px-3 py-2">{editable ? <ItemSelect value={sc.itemData?.id || ""} onValueChange={(d) => onUpdateItemSelection(levelIndex, "scrap", idx, d)} items={items} compact /> : <span className="truncate">{sc.itemName || "Scrap Item"}</span>}</div>
                        <div className="px-3 py-2"><Input type="number" value={sc.quantity} onChange={(e) => handleScrapChange(idx, "quantity", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                        <div className="px-3 py-2"><Input type="number" value={sc.actual_quantity} onChange={(e) => handleScrapChange(idx, "actual_quantity", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                        <div className="px-3 py-2 text-center">{sc.unit || "Kg"}</div>
                        <div className="px-3 py-2"><Input type="number" value={sc.cost_alloc} onChange={(e) => handleScrapChange(idx, "cost_alloc", e.target.value)} disabled={!editable} className="h-8 w-20 text-xs text-center mx-auto" /></div>
                        <div className="px-3 py-2"><Input value={sc.comment || ""} onChange={(e) => handleScrapChange(idx, "comment", e.target.value)} disabled={!editable} className="h-8 w-full text-xs" placeholder="Comment" /></div>
                        {showCost && <div className="px-3 py-2 text-center font-medium text-orange-700">₹{cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>}
                        {editable && <div className="px-3 py-2 flex justify-center"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveRow(levelIndex, "scrap", idx)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ══ Routing ══ */}
      <SectionHeader
        sectionKey="routing" label="Routing / Process Steps"
        icon={<GitBranch className="h-5 w-5 text-purple-600" />}
        actionLabel="Log Routing Data" actionColor="bg-purple-600 hover:bg-purple-700 text-white"
        actionSection="logRoutingData"
      />
      {data.expanded.routing && (
        <div className="p-6 border-b bg-gray-50">
          {editable && <div className="mb-6"><RoutingDialog onSelect={(r, c) => onAddRouting(levelIndex, r, c)} levelIndex={levelIndex} existingRoutingIds={existingRoutingIds} /></div>}
          {data.routing.length === 0
            ? <div className="text-center py-8 text-gray-500">No routing steps defined</div>
            : (
              <div className="overflow-x-auto">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-8 text-xs font-medium text-gray-600 bg-gray-100 border-b">
                    {["#", "NUMBER", "NAME", "DONE", "QTY COMPLETED", "COMMENT", "CREATED AT", ...(editable ? ["Actions"] : [])].map((h) => (
                      <div key={h} className="px-3 py-2">{h}</div>
                    ))}
                  </div>
                  {data.routing.map((r, i) => (
                    <div key={`rt-${levelIndex}-${r.routingId || i}`} className="grid grid-cols-8 border-b hover:bg-gray-50 text-xs items-center">
                      <div className="px-3 py-2 text-gray-500">{i + 1}</div>
                      <div className="px-3 py-2 truncate">{r.routingNumber || "N/A"}</div>
                      <div className="px-3 py-2 truncate">{r.routingName || "N/A"}</div>
                      <div className="px-3 py-2 flex justify-center"><input type="checkbox" checked={r.is_done || false} onChange={(e) => handleRoutingChange(i, "is_done", e.target.checked)} disabled={!editable} className="h-4 w-4" /></div>
                      <div className="px-3 py-2"><Input type="number" value={r.quantity_completed || 0} onChange={(e) => handleRoutingChange(i, "quantity_completed", e.target.value)} disabled={!editable} className="h-8 w-full text-xs text-center" /></div>
                      <div className="px-3 py-2"><Input value={r.comment || ""} onChange={(e) => handleRoutingChange(i, "comment", e.target.value)} disabled={!editable} className="h-8 w-full text-xs" placeholder="Comment" /></div>
                      <div className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "N/A"}</div>
                      {editable && <div className="px-3 py-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveRouting(levelIndex, i)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ══ Other Charges ══ */}
      {data.otherCharges.length > 0 && (
        <>
          <SectionHeader
            sectionKey="otherCharges" label="Other Charges"
            icon={<DollarSign className="h-5 w-5 text-teal-600" />}
            actionLabel="Log Other Charges" actionColor="bg-teal-600 hover:bg-teal-700 text-white"
            actionSection="logOtherCharges"
          />
          {data.expanded.otherCharges && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className={`grid ${showCost ? "grid-cols-6" : "grid-cols-5"} text-xs font-medium text-gray-600 bg-gray-100 border-b`}>
                    {["#", "CLASSIFICATION", "ESTIMATED CHARGES", "BOM CHARGES", "COMMENT", ...(showCost ? ["TOTAL COST"] : [])].map((h) => (
                      <div key={h} className="px-3 py-2">{h}</div>
                    ))}
                  </div>
                  {data.otherCharges.map((oc, i) => (
                    <div key={`oc-${levelIndex}-${oc.id}`} className={`grid ${showCost ? "grid-cols-6" : "grid-cols-5"} border-b hover:bg-gray-50 text-xs items-center`}>
                      <div className="px-3 py-2 text-gray-500">{i + 1}</div>
                      <div className="px-3 py-2 flex items-center gap-2">
                        {oc.bomOtherCharge?.classification === "Labour Charges" && <Users className="h-4 w-4 text-gray-400" />}
                        {oc.bomOtherCharge?.classification === "Machinery Charges" && <Factory className="h-4 w-4 text-gray-400" />}
                        {oc.bomOtherCharge?.classification === "Electricity Charges" && <Zap className="h-4 w-4 text-gray-400" />}
                        {oc.bomOtherCharge?.classification === "Other Charges" && <Wrench className="h-4 w-4 text-gray-400" />}
                        <span className="font-medium truncate">{oc.bomOtherCharge?.classification || "N/A"}</span>
                      </div>
                      <div className="px-3 py-2"><Input type="number" value={oc.charges_estimate} onChange={(e) => handleChargeChange(i, "charges_estimate", e.target.value)} disabled={!editable} className="h-8 w-full text-xs text-center" /></div>
                      <div className="px-3 py-2 text-center">₹{oc.bomOtherCharge?.charges || 0}</div>
                      <div className="px-3 py-2"><Input value={oc.comment || ""} onChange={(e) => handleChargeChange(i, "comment", e.target.value)} disabled={!editable} className="h-8 w-full text-xs" placeholder="Comment" /></div>
                      {showCost && <div className="px-3 py-2 text-center font-medium text-teal-700">₹{oc.charges_estimate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
ProcessLevel.displayName = "ProcessLevel";

// ─────────────────────────────────────────────────────────────────────────────
// rehydrateLevels — shared helper to map raw API productionItems → ProcessLevelData[]
// ─────────────────────────────────────────────────────────────────────────────
const rehydrateLevels = (productionItems: any[], items: Item[]): ProcessLevelData[] =>
  productionItems.map((item: any) => ({
    expanded: { finishedGoods: true, rawMaterials: true, routing: true, scrap: true, otherCharges: true },
    id: item.id || Date.now(),
    bomItemId: item.bomItem?.id || 0,
    finishedGoods: (item.finishedGoods || []).map((f: any) => ({
      ...f,
      itemName: f.bomFinishedGoods?.item?.name || "Unknown",
      itemData: items.find((i) => i.id === f.bomFinishedGoods?.item?.id?.toString()),
      bomFinishedGoodsId: f.bomFinishedGoods?.id || 0,
      unit: f.bomFinishedGoods?.unit?.name || "Kg",
      costAlloc: f.costAlloc || 0,
      forRepair: f.forRepair || 0,
      repaired: f.repaired || 0,
      accept_quantity: f.accept_quantity || f.total_mfg_quantity || 0,
    })),
    rawMaterials: (item.rawMaterials || []).map((r: any) => ({
      ...r,
      itemName: r.bomRawMaterial?.item?.name || "Unknown",
      itemData: items.find((i) => i.id === r.bomRawMaterial?.item?.id?.toString()),
      bomRawMaterialId: r.bomRawMaterial?.id || 0,
      currentStock: items.find((i) => i.id === r.bomRawMaterial?.item?.id?.toString())?.currentStock || "0",
      estimatedProduction: r.estimatedProduction || 0,
      produced: r.produced || 0,
      unit: r.bomRawMaterial?.unit?.name || "Kg",
    })),
    routing: (item.routing || []).map((r: any) => ({
      routingId: r.bomRouting?.routing?.id,
      productionRoutingId: r.id,
      routingNumber: r.bomRouting?.routing?.number,
      routingName: r.bomRouting?.routing?.name,
      is_done: r.is_done || false,
      quantity_completed: r.quantity_completed || 0,
      comment: r.comment || "",
      createdAt: r.createdAt || new Date().toISOString(),
    })),
    scrap: (item.scrap || []).map((s: any) => ({
      ...s,
      itemName: s.bomScrap?.item?.name || "Unknown",
      itemData: items.find((i) => i.id === s.bomScrap?.item?.id?.toString()),
      bomScrapId: s.bomScrap?.id || 0,
      unit: s.bomScrap?.unit?.name || "Kg",
    })),
    otherCharges: (item.other_charges || []).map((oc: any) => ({
      ...oc,
      bomOtherChargeId: oc.bomOtherCharge?.id || 0,
      bomOtherCharge: oc.bomOtherCharge,
    })),
  }));

// ─────────────────────────────────────────────────────────────────────────────
// ProcessDetails — main page
// ─────────────────────────────────────────────────────────────────────────────
const ProcessDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showProcessCost, setShowProcessCost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [processId, setProcessId] = useState<string | null>(null);

  // ── TakeActionsDialog ──
  const [takeActionsOpen, setTakeActionsOpen] = useState(false);
  const [takeActionsSection, setTakeActionsSection] = useState<TakeActionSection>("markFGProduced");

  const openTakeActions = useCallback((section: TakeActionSection) => {
    setTakeActionsSection(section);
    setTakeActionsOpen(true);
  }, []);

  // ── StoreIssueApprovalDialog ──
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalMeta, setApprovalMeta] = useState<StoreIssueApprovalMeta>({
    documentType: "", documentAction: "Document Created",
    createdBy: "", approvedBy: "", comment: "",
    documentNumber: "", noOfItems: 0,
    creationDate: "", approvalDate: "", referenceId: "",
  });
  const [approvalRows, setApprovalRows] = useState<ApprovalRow[]>([]);

  // ── FGTestingSidebar ──
  const [fgTestingOpen, setFgTestingOpen] = useState(false);

  // ── Confirmation dialogs ──
  const [publishConfirmOpen,      setPublishConfirmOpen]      = useState(false);
  const [startProcessConfirmOpen, setStartProcessConfirmOpen] = useState(false);
  const [completeConfirmOpen,     setCompleteConfirmOpen]     = useState(false);
  const [completeWarnings,        setCompleteWarnings]        = useState<string[]>([]);

  // ── Process data ──
  const [overallCost, setOverallCost] = useState<CostBreakdown>({
    totalRawMaterialCost: 0, totalFinishedGoodsCost: 0,
    totalScrapCost: 0, totalOtherCharges: 0, grandTotal: 0,
  });
  const [processDetails, setProcessDetails] = useState<ProcessDetailsType>({
    processNumber: "", orderDeliveryDate: "", expectedCompletionDate: "",
    status: "planned", stage: "Planning", createdAt: "", updatedAt: "", createdBy: "",
    fgStore: { name: "", city: "", postalCode: "", id: 0 },
    rmStore: { name: "", city: "", postalCode: "", id: 0 },
    scrapStore: { name: "", city: "", postalCode: "", id: 0 },
    description: "", comments: "", bomId: 0,
  });
  const [items, setItems] = useState<Item[]>([]);
  const [levels, setLevels] = useState<ProcessLevelData[]>([]);

  const formatDate = useCallback((s: string) => {
    const d = new Date(s);
    return `${d.toLocaleDateString("en-GB")} - ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, []);

  const getStageFromStatus = useCallback((s: ProductionStatus) => {
    switch (s) {
      case "planned":     return "Planned";
      case "publish":     return "Pending";
      case "in_progress": return "WIP";
      case "complete":    return "Complete";
      case "cancelled":   return "Cancelled";
      default:            return "Planned";
    }
  }, []);

  useEffect(() => {
    if (!levels.length) return;
    const overall = levels.reduce((acc, l) => {
      const c = calculateCostsForLevel(l);
      return {
        totalRawMaterialCost:    acc.totalRawMaterialCost    + c.totalRawMaterialCost,
        totalFinishedGoodsCost:  acc.totalFinishedGoodsCost  + c.totalFinishedGoodsCost,
        totalScrapCost:          acc.totalScrapCost          + c.totalScrapCost,
        totalOtherCharges:       acc.totalOtherCharges       + c.totalOtherCharges,
        grandTotal:              acc.grandTotal              + c.grandTotal,
      };
    }, { totalRawMaterialCost: 0, totalFinishedGoodsCost: 0, totalScrapCost: 0, totalOtherCharges: 0, grandTotal: 0 });
    setOverallCost(overall);
  }, [levels]);

  useEffect(() => {
    (async () => {
      try {
        const res = await get<ItemsAPIResponse>("/inventory/item");
        if (res?.status && Array.isArray(res.data)) {
          setItems(res.data.map((item: any) => ({
            id: item.id?.toString() || "", name: item.name || "", sku: item.sku || "",
            unit: item.unit, category: item.category,
            currentStock: item.currentStock || "0", defaultPrice: item.defaultPrice || "0",
            hsnCode: item.hsnCode || "", minimumStockLevel: item.minimumStockLevel || "0",
            maximumStockLevel: item.maximumStockLevel || "0",
            regularBuyingPrice: item.regularBuyingPrice || "0",
            regularSellingPrice: item.regularSellingPrice || "0",
          })));
        }
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    const fetchProcess = async () => {
      const id = searchParams.get("processId");
      if (!id) { toast.error("No process ID provided"); navigate("/production"); return; }
      setProcessId(id);
      try {
        setLoading(true);
        const raw = await productionAPI.getProductionById(parseInt(id));
        // ── FIX: normalise before reading .status / .data ──
        const res = normaliseResponse(raw);
        if (res?.status && res.data) {
          const d = res.data;
          setProcessDetails({
            processNumber: d.docNumber || "",
            orderDeliveryDate: d.orderDeliveryDate || "",
            expectedCompletionDate: d.expectedCompletionDate || "",
            status: d.status || "planned",
            stage: getStageFromStatus(d.status || "planned"),
            createdAt: d.createdAt ? formatDate(d.createdAt) : "-",
            updatedAt: d.updatedAt ? formatDate(d.updatedAt) : "-",
            createdBy: d.createdBy?.name || "Unknown",
            fgStore: d.fgStore
              ? { name: d.fgStore.name || "", address1: d.fgStore.address1 || "", city: d.fgStore.city || "", postalCode: d.fgStore.postalCode || "", id: d.fgStore.id || 0 }
              : { name: "", city: "", postalCode: "", id: 0 },
            rmStore: d.rmStore
              ? { name: d.rmStore.name || "", address1: d.rmStore.address1 || "", city: d.rmStore.city || "", postalCode: d.rmStore.postalCode || "", id: d.rmStore.id || 0 }
              : { name: "", city: "", postalCode: "", id: 0 },
            scrapStore: d.scrapStore
              ? { name: d.scrapStore.name || "", address1: d.scrapStore.address1 || "", city: d.scrapStore.city || "", postalCode: d.scrapStore.postalCode || "", id: d.scrapStore.id || 0 }
              : { name: "", city: "", postalCode: "", id: 0 },
            description: (d as any).description || "",
            comments: (d as any).comments || "",
            bomId: d.bom?.id || 0,
          });
          if (d.productionItems && Array.isArray(d.productionItems)) {
            setLevels(rehydrateLevels(d.productionItems, items));
          } else {
            setLevels([{
              expanded: { finishedGoods: true, rawMaterials: true, routing: true, scrap: true, otherCharges: true },
              id: 1, bomItemId: 0,
              finishedGoods: [], rawMaterials: [], routing: [], scrap: [], otherCharges: [],
            }]);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load process details");
      } finally {
        setLoading(false);
      }
    };
    if (items.length > 0) fetchProcess();
  }, [searchParams, navigate, items, formatDate, getStageFromStatus]);

  useEffect(() => () => { setLevels([]); setIsEditMode(false); }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // handleTakeActionsSave
  // ─────────────────────────────────────────────────────────────────────────
  const handleTakeActionsSave = useCallback(async (saveData: {
    fgRows: any[]; rmRows: any[]; routingRows: any[];
    scrapRows: any[]; chargeRows: any[]; markTestedAndPassed: boolean;
  }) => {
    if (!processId) return;

    // ── 1. Build fg_data ──
    const fg_data: TakeActionPayload["form_data"]["fg_data"] = {};
    for (const row of saveData.fgRows) {
      if ((row.quantityAdded ?? 0) > 0) {
        fg_data[row.itemId] = { change_quantity: Number(row.quantityAdded), comment: row.comment || "" };
      }
    }

    // ── 2. Build rm_data ──
    const rm_data: TakeActionPayload["form_data"]["rm_data"] = {};
    for (const row of saveData.rmRows) {
      if ((row.quantity ?? 0) > 0) {
        let change_type: "issue" | "return" | "line_reject" = "issue";
        const al = (row.addLess || "").toLowerCase();
        if (al.includes("return")) change_type = "return";
        else if (al.includes("line") || al.includes("reject")) change_type = "line_reject";
        rm_data[row.itemId] = {
          change_quantity: Number(row.quantity),
          comment: row.comment || "",
          change_type,
          ...(row.barcodeId != null ? { barcodeId: Number(row.barcodeId) } : {}),
          selected_store: {
            name: row.store || processDetails.rmStore.name,
            id: String(processDetails.rmStore.id),
          },
        };
      }
    }

    // ── 3. Build scrap_data ──
    const scrap_data: TakeActionPayload["form_data"]["scrap_data"] = {};
    for (const row of saveData.scrapRows) {
      const qty = Number(row.actualQty ?? 0);
      if (qty > 0) {
        scrap_data[row.itemId] = { change_quantity: qty, comment: row.comment || "" };
      }
    }

    // ── 4. Build other_charges_data ──
    const other_charges_data: TakeActionPayload["form_data"]["other_charges_data"] =
      saveData.chargeRows.map((row: any, index: number) => ({
        charges: Number(row.actualAmount ?? row.estimatedAmount ?? 0),
        comment: row.comment || "",
        classification: row.classification || "",
        charges_estimate: Number(row.estimatedAmount ?? 0),
        charges_actual: Number(row.actualAmount ?? 0),
        index,
      }));

    // ── 5. Build routing_data ──
    const routing_data: TakeActionPayload["form_data"]["routing_data"] =
      saveData.routingRows.map((row: any, index: number) => ({
        comment: row.comment || "",
        id: String(row.productionRoutingId ?? row.routingId ?? ""),
        is_done: Boolean(row.markDone),
        order: Number(row.order ?? index + 1),
        quantity_completed: Number(row.changeInFGQty ?? 0),
        routing_desc: "",
        routing_id: String(row.routingId ?? ""),
        routing_name: row.routingName || "",
        routing_number: row.routingNumber || "",
        change_in_quantity: Number(row.changeInFGQty ?? 0),
        completion_percent: `${Number(row.completionPercent ?? 0)}%`,
        final_quantity: Number(row.finalFGQty ?? 0),
        index,
        mark_done: Boolean(row.markDone),
        previous_quantity: Number(row.currentFGQty ?? 0),
      }));

    const payload: TakeActionPayload = {
      form_data: {
        fg_data, rm_data, scrap_data, other_charges_data, routing_data,
        mark_items_tested: Boolean(saveData.markTestedAndPassed),
      },
      process_id: String(processId),
    };

    const hasChanges =
      Object.keys(fg_data).length > 0 ||
      Object.keys(rm_data).length > 0 ||
      Object.keys(scrap_data).length > 0 ||
      other_charges_data.length > 0 ||
      routing_data.length > 0;

    if (!hasChanges) {
      toast.info("No quantity changes detected — nothing to submit");
      return;
    }

    try {
      const raw = await productionAPI.takeAction(parseInt(processId), payload);

      // ── FIX: use normaliseResponse instead of the broken (raw as any)?.data ?? raw ──
      const res = normaliseResponse(raw);

      if (res?.status !== true) {
        toast.error(res?.message || "Take action failed");
        return;
      }

      toast.success(res?.message || "Production action completed successfully!");
      setTakeActionsOpen(false);

      // ── Refresh the page data so all quantities update ──
      try {
        const refreshRaw = await productionAPI.getProductionById(parseInt(processId));
        // ── FIX: normalise the refresh response the same way ──
        const refreshRes = normaliseResponse(refreshRaw);
        const d = refreshRes?.data ?? refreshRes; // unwrap inner .data if present

        if (d?.productionItems) {
          setProcessDetails((prev) => ({
            ...prev,
            status: d.status ?? prev.status,
            stage: getStageFromStatus(d.status ?? prev.status),
            updatedAt: d.updatedAt ? formatDate(d.updatedAt) : prev.updatedAt,
          }));
          setLevels(rehydrateLevels(d.productionItems, items));
        }
      } catch (refreshErr) {
        console.warn("Page refresh after takeAction failed:", refreshErr);
      }

      // ── Build and open StoreIssueApprovalDialog ──
      // For FG Produced: only open approval if markTestedAndPassed is true.
      // If not marked tested, quantities go to FG Testing — no approval popup yet.
      const skipApproval =
        takeActionsSection === "markFGProduced" && !saveData.markTestedAndPassed;

      const { rows, docType, docAction } = buildApprovalRows(takeActionsSection, saveData);
      if (rows.length > 0 && !skipApproval) {
        const now    = new Date();
        const nowStr = `${now.toLocaleDateString("en-GB")} - ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        setApprovalMeta({
          documentType:   docType,
          documentAction: docAction,
          createdBy:      processDetails.createdBy,
          approvedBy:     processDetails.createdBy,
          comment:        "",
          documentNumber: processDetails.processNumber,
          noOfItems:      rows.length,
          creationDate:   nowStr,
          approvalDate:   nowStr,
          referenceId:    "",
          // ── Barcode context ──────────────────────────────────
          // Only "markFGProduced" supports barcode generation
          sourceType:   takeActionsSection === "markFGProduced" ? "FG" : "NONE",
          productionId: parseInt(processId!),
          fgStoreId:    processDetails.fgStore.id,
        });
        setApprovalRows(rows);
        setApprovalOpen(true);
      }
    } catch (err: any) {
      console.error("takeAction error:", err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to save actions";
      toast.error(apiMsg);
    }
  }, [processId, takeActionsSection, processDetails.createdBy, processDetails.processNumber, processDetails.rmStore, items, getStageFromStatus, formatDate]);

  // ── FG Testing save ──
  const handleFGTestingSave = useCallback(async (data: FGTestingData[]) => {
    if (!processId) return;
    for (const fg of data) {
      const payload: FGTestPayload = {
        tested: Number(fg.tested ?? 0),
        passed: Number(fg.passed ?? 0),
        rejected: Number(fg.rejected ?? 0),
        send_for_repair: Number(fg.forRepair ?? 0),
        comment: fg.comment || "",
      };
      const res = await productionAPI.fgTest(parseInt(processId), payload);
      if (!res?.status) {
        toast.error(res?.message || `FG test save failed for ${fg.fgName}`);
        return;
      }
    }
    toast.success("FG testing data saved!");

    try {
      const refreshRaw = await productionAPI.getProductionById(parseInt(processId));
      const refreshRes = normaliseResponse(refreshRaw);
      const d = refreshRes?.data ?? refreshRes;

      if (d) {
        setProcessDetails((prev) => ({
          ...prev,
          status: d.status || prev.status,
          stage: getStageFromStatus(d.status || prev.status),
          updatedAt: d.updatedAt ? formatDate(d.updatedAt) : prev.updatedAt,
        }));
        if (d.productionItems && Array.isArray(d.productionItems)) {
          setLevels(rehydrateLevels(d.productionItems, items));
        }
      }
    } catch (e) {
      console.error("Failed to refresh process after FG test:", e);
    }

    // ── Open StoreIssueApprovalDialog for FG Testing (same as FG Produced) ──
    const testedRows = data
      .filter((fg) => (fg.passed ?? 0) > 0)
      .map((fg, i) => ({
        seq: i + 1,
        itemId: String(fg.fgId),
        description: fg.fgName,
        productCategory: "Semi-finished Goods",
        action: "Add to Store",
        fromStore: "—",
        toStore: processDetails.fgStore.name || "FG Store",
        documentQuantity: Number(fg.passed ?? 0),
        approvedQuantity: Number(fg.passed ?? 0),
        unit: "Nos",
        baseQuantity: Number(fg.passed ?? 0),
        baseUnit: "Nos",
        currentStock: 0,
        comment: fg.comment || "",
        rawItemId: String(fg.fgId),
      }));

    if (testedRows.length > 0) {
      const now    = new Date();
      const nowStr = `${now.toLocaleDateString("en-GB")} - ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      setApprovalMeta({
        documentType:   "Process FG Testing",
        documentAction: "Document Created",
        createdBy:      processDetails.createdBy,
        approvedBy:     processDetails.createdBy,
        comment:        "",
        documentNumber: processDetails.processNumber,
        noOfItems:      testedRows.length,
        creationDate:   nowStr,
        approvalDate:   nowStr,
        referenceId:    "",
        sourceType:     "FG",
        productionId:   parseInt(processId),
        fgStoreId:      processDetails.fgStore.id,
      });
      setApprovalRows(testedRows);
      setApprovalOpen(true);
    }
  }, [processId, items, processDetails, getStageFromStatus, formatDate]);

  // ── Level callbacks ──
  const updateLevel = useCallback((i: number, u: ProcessLevelData) => {
    setLevels((p) => { const n = [...p]; n[i] = u; return n; });
  }, []);

  const addRow = useCallback((levelIndex: number, type: "rm" | "scrap") => {
    setLevels((prev) =>
      prev.map((l, i) => {
        if (i !== levelIndex) return l;
        const newId = Date.now() + Math.random();
        return {
          ...l,
          rawMaterials: type === "rm"
            ? [...l.rawMaterials, { id: newId, req_quantity: 0, actual_used_quantity: 0, tested_quantity: 0, comment: null, itemName: "", itemData: undefined, bomRawMaterialId: 0, currentStock: "0", estimatedProduction: 0, produced: 0, unit: "Kg" }]
            : l.rawMaterials,
          scrap: type === "scrap"
            ? [...l.scrap, { id: newId, quantity: 0, actual_quantity: 0, cost_alloc: 0, comment: null, itemName: "", itemData: undefined, bomScrapId: 0, unit: "Kg" }]
            : l.scrap,
        };
      })
    );
  }, []);

  const removeRow = useCallback((levelIndex: number, type: "rm" | "scrap", index: number) => {
    setLevels((prev) =>
      prev.map((l, i) => {
        if (i !== levelIndex) return l;
        return {
          ...l,
          rawMaterials: type === "rm" ? l.rawMaterials.filter((_, j) => j !== index) : l.rawMaterials,
          scrap: type === "scrap" ? l.scrap.filter((_, j) => j !== index) : l.scrap,
        };
      })
    );
  }, []);

  const updateItemSelection = useCallback((levelIndex: number, type: "fg" | "rm" | "scrap", index: number, itemData?: Item) => {
    setLevels((prev) =>
      prev.map((l, i) => {
        if (i !== levelIndex) return l;
        const upd = (arr: any[]) => arr.map((row, j) =>
          j === index
            ? { ...row, itemData, itemName: itemData?.name || "", unit: itemData?.unit?.name || "Kg", currentStock: (itemData as any)?.currentStock ?? row.currentStock }
            : row
        );
        return {
          ...l,
          finishedGoods: type === "fg"    ? upd(l.finishedGoods) : l.finishedGoods,
          rawMaterials:  type === "rm"    ? upd(l.rawMaterials)  : l.rawMaterials,
          scrap:         type === "scrap" ? upd(l.scrap)         : l.scrap,
        };
      })
    );
  }, []);

  const addRouting = useCallback((levelIndex: number, routing: Routing, comment: string) => {
    setLevels((prev) =>
      prev.map((l, i) => {
        if (i !== levelIndex) return l;
        return {
          ...l,
          routing: [...l.routing, { routingId: routing.id, routingNumber: routing.number, routingName: routing.name, comment, createdAt: new Date().toISOString(), is_done: false, quantity_completed: 0 }],
        };
      })
    );
    toast.success(`Routing "${routing.number}" added`);
  }, []);

  const removeRouting = useCallback((levelIndex: number, index: number) => {
    setLevels((prev) => prev.map((l, i) => i !== levelIndex ? l : { ...l, routing: l.routing.filter((_, j) => j !== index) }));
  }, []);

  const handleSaveChanges = async () => {
    if (!processId) return;
    try {
      setSaving(true);
      type UpdateableStatus = "planned" | "publish" | "in_progress" | "complete" | "cancelled";
      const statusToUpdateable: Record<ProductionStatus, UpdateableStatus> = {
        planned:     "planned",
        publish:     "in_progress",
        in_progress: "in_progress",
        complete:    "complete",
        cancelled:   "cancelled",
      };
      const apiStatus: UpdateableStatus = statusToUpdateable[processDetails.status];

      const productionItems = levels.map((l) => ({
        bomItemId: l.bomItemId,
        finishedGoods: l.finishedGoods.map((f) => ({
          bomFinishedGoodsId: f.bomFinishedGoodsId,
          req_quantity: Number(f.req_quantity) || 0,
          total_mfg_quantity: Number(f.total_mfg_quantity) || 0,
          tested_quantity: Number(f.tested_quantity) || 0,
          accept_quantity: Number(f.accept_quantity) || 0,
          reject_quantity: Number(f.reject_quantity) || 0,
          actual_used_quantity: Number(f.actual_used_quantity) || 0,
          costAlloc: Number(f.costAlloc) || 0,
          forRepair: Number(f.forRepair) || 0,
          repaired: Number(f.repaired) || 0,
          comment: f.comment || "",
        })),
        rawMaterials: l.rawMaterials.map((r) => ({
          bomRawMaterialId: r.bomRawMaterialId,
          req_quantity: Number(r.req_quantity) || 0,
          actual_used_quantity: Number(r.actual_used_quantity) || 0,
          tested_quantity: Number(r.tested_quantity) || 0,
          estimatedProduction: Number(r.estimatedProduction) || 0,
          produced: Number(r.produced) || 0,
          comment: r.comment || "",
        })),
        routing: l.routing.map((r) => ({
          bomRoutingId: r.routingId,
          is_done: Boolean(r.is_done),
          quantity_completed: Number(r.quantity_completed) || 0,
          comment: r.comment || "",
        })),
        scrap: l.scrap.map((s) => ({
          bomScrapId: s.bomScrapId,
          quantity: Number(s.quantity) || 0,
          actual_quantity: Number(s.actual_quantity) || 0,
          cost_alloc: Number(s.cost_alloc) || 0,
          comment: s.comment || "",
        })),
        other_charges: l.otherCharges.map((oc) => ({
          bomOtherChargeId: oc.bomOtherChargeId,
          charges_estimate: Number(oc.charges_estimate) || 0,
          comment: oc.comment || "",
        })),
      }));

      const payload = {
        status: apiStatus,
        bomId: processDetails.bomId,
        rmStore: processDetails.rmStore.id || 0,
        fgStore: processDetails.fgStore.id || 0,
        scrapStore: processDetails.scrapStore.id || 0,
        orderDeliveryDate: processDetails.orderDeliveryDate || new Date().toISOString().split("T")[0],
        expectedCompletionDate: processDetails.expectedCompletionDate || new Date().toISOString().split("T")[0],
        description: processDetails.description,
        comments: processDetails.comments,
        attachments: { existing_attachments: [] },
        productionItems,
      };

      const res = await productionAPI.updateProduction(parseInt(processId), payload);
      if (res.status) {
        toast.success("Process updated!");
        setProcessDetails((p) => ({ ...p, updatedAt: formatDate(new Date().toISOString()) }));
        setIsEditMode(false);
      } else {
        toast.error(res.message || "Failed to update");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!processId) return;
    try {
      setActionLoading(true);
      const res = normaliseResponse(await productionAPI.publishProduction(parseInt(processId)));
      if (res?.status !== false) {
        toast.success("Process published!");
        setProcessDetails((p) => ({ ...p, status: "publish", stage: "Pending", updatedAt: formatDate(new Date().toISOString()) }));
      } else {
        toast.error(res?.message || "Failed to publish");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to publish");
    } finally {
      setActionLoading(false);
      setPublishConfirmOpen(false);
    }
  };

  const handleStartProcess = async () => {
    if (!processId) return;
    try {
      setActionLoading(true);
      const res = normaliseResponse(await productionAPI.startProduction(parseInt(processId)));
      if (res?.status !== false) {
        toast.success("Process started!");
        setProcessDetails((p) => ({ ...p, status: "in_progress", stage: "WIP", updatedAt: formatDate(new Date().toISOString()) }));
      } else {
        toast.error(res?.message || "Failed to start process");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to start process");
    } finally {
      setActionLoading(false);
      setStartProcessConfirmOpen(false);
    }
  };

  const buildCompleteWarnings = useCallback((): string[] => {
    const warnings: string[] = [];
    levels.forEach((l) => {
      l.finishedGoods.forEach((f) => {
        if ((f.total_mfg_quantity || 0) < f.req_quantity) {
          warnings.push(`FG Produced: ${f.total_mfg_quantity || 0} ${f.unit || "Kg"} is less than target ${f.req_quantity} ${f.unit || "Kg"}`);
        }
      });
      l.rawMaterials.forEach((r) => {
        if ((r.actual_used_quantity || 0) === 0 && (r.req_quantity || 0) > 0) {
          warnings.push(`Quantity issued for 1 or more RM is 0`);
          return;
        }
      });
    });
    return [...new Set(warnings)];
  }, [levels]);

  const openCompleteConfirm = useCallback(() => {
    setCompleteWarnings(buildCompleteWarnings());
    setCompleteConfirmOpen(true);
  }, [buildCompleteWarnings]);

  const handleComplete = async () => {
    if (!processId) return;
    try {
      setActionLoading(true);
      const res = normaliseResponse(await productionAPI.completeProduction(parseInt(processId)));
      if (res?.status !== false) {
        toast.success("Process completed!");
        setProcessDetails((p) => ({ ...p, status: "complete", stage: "Complete" }));
        navigate("/production?tab=all-production-process");
      } else {
        toast.error(res?.message || "Failed to complete");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to complete");
    } finally {
      setActionLoading(false);
      setCompleteConfirmOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!processId) return;
    try {
      setActionLoading(true);
      const res = normaliseResponse(await productionAPI.cancelProduction(parseInt(processId)));
      if (res?.status !== false) {
        toast.success("Cancelled!");
        setProcessDetails((p) => ({ ...p, status: "cancelled", stage: "Cancelled" }));
      } else {
        toast.error(res?.message || "Failed to cancel");
      }
    } catch {
      toast.error("Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  };

  const allFGItems = useMemo(() => levels.flatMap((l) => l.finishedGoods), [levels]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b">
        <div className="max-w-8xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></Button>
            <div>
              <h1 className="text-2xl font-bold">Production Process Details</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>Process ID: <strong>{processDetails.processNumber}</strong></span>
                <span>Status: <strong className="capitalize">{processDetails.stage}</strong></span>
                {showProcessCost && <span><DollarSign className="h-4 w-4 text-green-600 inline" /> <strong>₹{overallCost.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowProcessCost(!showProcessCost)} className="flex items-center gap-2">
              {showProcessCost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showProcessCost ? "Hide Costs" : "Show Costs"}
            </Button>
            {!["complete", "cancelled"].includes(processDetails.status) && !isEditMode && (
              <Button onClick={() => { if (["complete", "cancelled"].includes(processDetails.status)) { toast.error("Cannot edit"); return; } setIsEditMode(true); }} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-8 py-6">
        {/* Info card */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Process Details</h2>
            {showProcessCost && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="font-bold text-blue-700">Total: ₹{overallCost.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-blue-600">RM: ₹{overallCost.totalRawMaterialCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-green-600">FG: ₹{overallCost.totalFinishedGoodsCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-orange-600">Scrap: ₹{overallCost.totalScrapCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className="text-teal-600">Other: ₹{overallCost.totalOtherCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                {[{ label: "Created By", value: processDetails.createdBy }, { label: "Creation Date", value: processDetails.createdAt }, { label: "Last Updated", value: processDetails.updatedAt }].map(({ label, value }) => (
                  <div key={label} className="flex justify-between"><span className="text-sm font-medium text-gray-600">{label}:</span><span className="text-sm">{value}</span></div>
                ))}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    processDetails.status === "planned"     ? "bg-blue-100 text-blue-800"     :
                    processDetails.status === "publish"     ? "bg-indigo-100 text-indigo-800" :
                    processDetails.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                    processDetails.status === "complete"    ? "bg-green-100 text-green-800"   :
                    "bg-red-100 text-red-800"
                  }`}>{processDetails.stage}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "FG Store", store: processDetails.fgStore, color: "blue" }, { label: "RM Store", store: processDetails.rmStore, color: "green" }, { label: "Scrap Store", store: processDetails.scrapStore, color: "orange" }].map(({ label, store, color }) => (
                  <div key={label} className="bg-gray-50 p-4 rounded-xl border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2"><Warehouse className={`h-5 w-5 text-${color}-600`} /><span className="text-sm font-semibold text-gray-700">{label}</span></div>
                    <div className="text-sm font-medium text-gray-900 truncate">{store.name || "Not Assigned"}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{store.city ? `${store.city}, ${store.postalCode}` : "No location"}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2"><Label>Order Delivery Date</Label><div className="flex items-center gap-2"><Input type="date" value={processDetails.orderDeliveryDate} onChange={(e) => setProcessDetails((p) => ({ ...p, orderDeliveryDate: e.target.value }))} disabled={!isEditMode} /><Calendar className="w-5 h-5 text-gray-400" /></div></div>
              <div className="space-y-2"><Label>Expected Completion Date</Label><div className="flex items-center gap-2"><Input type="date" value={processDetails.expectedCompletionDate} onChange={(e) => setProcessDetails((p) => ({ ...p, expectedCompletionDate: e.target.value }))} disabled={!isEditMode} /><Calendar className="w-5 h-5 text-gray-400" /></div></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><Label>Process Description</Label><Textarea value={processDetails.description} onChange={(e) => setProcessDetails((p) => ({ ...p, description: e.target.value }))} className="min-h-[100px] mt-2" disabled={!isEditMode} /></div>
              <div><Label>Comments & Instructions</Label><Textarea value={processDetails.comments} onChange={(e) => setProcessDetails((p) => ({ ...p, comments: e.target.value }))} className="min-h-[100px] mt-2" disabled={!isEditMode} /></div>
            </div>
          </div>
        </div>

        {/* Levels */}
        {levels.map((level, idx) => (
          <ProcessLevel
            key={`level-${level.id}`}
            levelIndex={idx} data={level} items={items}
            isEditMode={isEditMode} processStatus={processDetails.status}
            onUpdateLevel={updateLevel} onAddRow={addRow} onRemoveRow={removeRow}
            onUpdateItemSelection={updateItemSelection}
            onAddRouting={addRouting} onRemoveRouting={removeRouting}
            showCost={showProcessCost}
            onOpenTakeActions={openTakeActions}
            onOpenFGTesting={() => setFgTestingOpen(true)}
          />
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t bg-white shadow-lg">
        <div className="max-w-8xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span>Process: {processDetails.processNumber}</span>
            <span className="mx-2">•</span>
            <span>Status: {processDetails.stage}</span>
          </div>
          <div className="flex gap-3">
            {isEditMode && (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                <Button onClick={handleSaveChanges} className="bg-[#105076] hover:bg-[#0d4566]" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            )}
            {!isEditMode && processDetails.status === "planned" && (
              <Button onClick={() => setPublishConfirmOpen(true)} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                <Play className="h-4 w-4 mr-2" />Publish
              </Button>
            )}
            {!isEditMode && processDetails.status === "publish" && (
              <Button onClick={() => setStartProcessConfirmOpen(true)} className="bg-[#105076] hover:bg-[#0d4566]" disabled={actionLoading}>
                <Play className="h-4 w-4 mr-2" />Start Process
              </Button>
            )}
            {!isEditMode && processDetails.status === "in_progress" && (
              <>
                <Button onClick={() => openTakeActions("markFGProduced")} className="bg-[#105076] hover:bg-[#0d4566]" disabled={actionLoading}>
                  <Zap className="h-4 w-4 mr-2" />Take Actions
                </Button>
                <Button onClick={openCompleteConfirm} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />Complete Process
                </Button>
              </>
            )}
            {!isEditMode && !["complete", "cancelled", "planned"].includes(processDetails.status) && (
              <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
                <XCircle className="h-4 w-4 mr-2" />Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Publish Confirmation Dialog ── */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Are you sure you want to publish the document?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">By Publishing the process, Master Process and all Child Processes will be published.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setPublishConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Start Process Confirmation Dialog ── */}
      <Dialog open={startProcessConfirmOpen} onOpenChange={setStartProcessConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Are you sure you want to Start process?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 mt-2">This will change the Status of all related process to WIP</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setStartProcessConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleStartProcess} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Yes, Start
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Complete Process Confirmation Dialog ── */}
      <Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Are you sure you want to complete the Production process?</DialogTitle></DialogHeader>
          {completeWarnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {completeWarnings.map((w, i) => (<p key={i} className="text-sm text-red-600">{i + 1}. {w}</p>))}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-3">Note: All sub-processes will be marked as complete.</p>
          {levels.flatMap((l) => l.finishedGoods).map((fg) => (
            <p key={fg.id} className="text-xs text-gray-500">Total FG Produced {fg.itemName}: {fg.total_mfg_quantity || 0} {fg.unit || "Kg"}</p>
          ))}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setCompleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── TakeActionsDialog ── */}
      <TakeActionsDialog
        open={takeActionsOpen}
        onClose={() => setTakeActionsOpen(false)}
        processNumber={processDetails.processNumber}
        levels={levels}
        defaultSection={takeActionsSection}
        onSaveChanges={handleTakeActionsSave}
      />

      {/* ── StoreIssueApprovalDialog ── */}
      <StoreIssueApprovalDialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        processId={processDetails.processNumber}
        meta={approvalMeta}
        rows={approvalRows}
      />

      {/* ── FGTestingSidebar ── */}
      <FGTestingSidebar
        open={fgTestingOpen}
        onClose={() => setFgTestingOpen(false)}
        fgItems={allFGItems}
        onMarkTested={handleFGTestingSave}
        onRefresh={() => { /* handled inside handleFGTestingSave */ }}
      />
    </div>
  );
};

export default ProcessDetails;
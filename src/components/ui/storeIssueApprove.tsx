// src/components/production/StoreIssueApprovalDialog.tsx
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  Printer,
  Barcode,
  CheckCircle,
  Loader2,
  // Warehouse,
} from "lucide-react";
import BarcodeDialog from "@/components/app/modals/BarcodeDialogue";
import { get } from "@/lib/apiService";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * "GRN"  → barcode dialog calls POST /inventory/grn/barcodes/bulk
 * "FG"   → barcode dialog calls POST /production/fg/barcodes/bulk
 * "NONE" → barcode button stays disabled (RM, scrap, routing, charges)
 */
export type BarcodeSourceType = "GRN" | "FG" | "NONE";

export interface ApprovalRow {
  /** sequential display number */
  seq: number;
  /**
   * For GRN: grnItemId string.
   * For FG: production FG record ID (used as fgId in barcode payload).
   */
  itemId: string;
  description: string;
  productCategory: string;
  /** e.g. "Issue from Store" | "Add to Store" | "Line Reject" */
  action: string;
  fromStore: string;
  toStore: string;
  documentQuantity: number;
  approvedQuantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
  currentStock: number;
  comment: string;
  /**
   * For FG rows: the actual inventory item ID sent as itemId in the barcode payload.
   */
  rawItemId?: string;
  /** For RM rows: selected batch number */
  batch?: string;
}

// ── Hierarchy types ───────────────────────────────────────────────────────────
interface HierarchyRack  { rackId: number; rackName: string; items: any[] }
interface HierarchyZone  { zoneId: number; zoneName: string; racks: Record<string, HierarchyRack> }
interface WHierarchy     { warehouseId: number; zones: Record<string, HierarchyZone> }
interface WarehouseOption { id: number; name: string }

const getHierarchyZones = (h: WHierarchy | null) => h ? Object.values(h.zones) : [];
const getHierarchyRacks = (h: WHierarchy | null, zoneId: string) => {
  if (!h || !zoneId) return [];
  return h.zones[zoneId] ? Object.values(h.zones[zoneId].racks) : [];
};

export interface StoreIssueApprovalMeta {
  documentType: string;    // "Process RM" | "Process FG" | "Process Scrap" …
  documentAction: string;  // "Document Created"
  createdBy: string;
  approvedBy: string;
  comment: string;
  documentNumber: string;  // e.g. "PID00928/1"
  noOfItems: number;
  creationDate: string;
  approvalDate: string;
  referenceId: string;

  // ── Barcode context (optional) ──────────────────────────────────────────
  /** Controls which API endpoint the barcode dialog uses. Defaults to "NONE". */
  sourceType?: BarcodeSourceType;
  /** Required when sourceType === "GRN" */
  grnId?: number;
  /** Required when sourceType === "FG" — the numeric production process ID */
  productionId?: number;
  /** Required when sourceType === "FG" — maps to warehouseId in the FG barcode payload */
  fgStoreId?: number;
}

export interface StoreIssueApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  processId: string;
  meta: StoreIssueApprovalMeta;
  rows: ApprovalRow[];
}

// ─────────────────────────────────────────────
// Helper: "APPROVED" stamp
// ─────────────────────────────────────────────
const ApprovedStamp: React.FC = () => (
  <div className="absolute top-4 left-6 z-10 pointer-events-none select-none">
    <div
      className="relative inline-flex items-center justify-center w-20 h-20"
      style={{ transform: "rotate(-12deg)" }}
    >
      <div
        className="absolute inset-0 rounded border-[3px] border-amber-500"
        style={{ borderRadius: "4px" }}
      />
      <span
        className="text-amber-500 font-extrabold text-[9px] tracking-widest uppercase text-center leading-tight"
        style={{ fontSize: "8.5px", letterSpacing: "0.12em" }}
      >
        APPROVED
      </span>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Meta field grid (top section)
// ─────────────────────────────────────────────
const MetaField: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex gap-2 text-xs">
    <span className="text-gray-500 whitespace-nowrap min-w-[110px]">{label}</span>
    <span className="font-medium text-gray-800 truncate">{value || "—"}</span>
  </div>
);

// ─────────────────────────────────────────────
// Map ApprovalRows → BarcodeDialog items
// ─────────────────────────────────────────────
const toBarcodeItems = (rows: ApprovalRow[], sourceType: BarcodeSourceType) =>
  rows.map((r) => ({
    // For GRN: id = grnItemId. For FG: id = production FG record ID (fgId).
    id: r.itemId,
    // For GRN: itemId is the same as id. For FG: use rawItemId (real inventory item ID).
    itemId: sourceType === "FG" ? (r.rawItemId ?? r.itemId) : r.itemId,
    itemCode: r.itemId,
    description: r.description,
    quantity: r.documentQuantity,
    unit: r.unit,
  }));

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const StoreIssueApprovalDialog: React.FC<StoreIssueApprovalDialogProps> = ({
  open,
  onClose,
  processId,
  meta,
  rows,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  const sourceType: BarcodeSourceType = meta.sourceType ?? "NONE";
  const isFG = sourceType === "FG";
  const isRM = meta.documentType?.toLowerCase().includes("rm") || meta.documentType?.toLowerCase().includes("raw");
  const canBarcode = sourceType === "GRN" || sourceType === "FG";

  // ── Warehouse / zone / rack for FG barcode ────────────────────────────────
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [hierarchy, setHierarchy] = useState<WHierarchy | null>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedRackId, setSelectedRackId] = useState<string>("");

  // ── Batch per row for RM ──────────────────────────────────────────────────
  const [batchMap, setBatchMap] = useState<Record<number, string>>({});

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedWarehouseId("");
      setHierarchy(null);
      setSelectedZoneId("");
      setSelectedRackId("");
      setBatchMap({});
    }
  }, [open]);

  // Pre-fill warehouse from fgStoreId
  useEffect(() => {
    if (open && isFG && meta.fgStoreId) {
      setSelectedWarehouseId(String(meta.fgStoreId));
    }
  }, [open, isFG, meta.fgStoreId]);

  // Fetch warehouse list
  useEffect(() => {
    if (!open || !isFG) return;
    get("/inventory/warehouse")
      .then((d) => { if (d?.status) setWarehouses(d.data); })
      .catch(() => {});
  }, [open, isFG]);

  // Fetch hierarchy when warehouse selected
  useEffect(() => {
    setSelectedZoneId(""); setSelectedRackId(""); setHierarchy(null);
    if (!selectedWarehouseId) return;
    setHierarchyLoading(true);
    get(`/inventory/store/stock/hierarchy/${selectedWarehouseId}`)
      .then((d) => { if (d?.status) setHierarchy(d.data); })
      .catch(() => {})
      .finally(() => setHierarchyLoading(false));
  }, [selectedWarehouseId]);

  // Reset rack when zone changes
  useEffect(() => { setSelectedRackId(""); }, [selectedZoneId]);

  const zones = useMemo(() => getHierarchyZones(hierarchy), [hierarchy]);
  const racks = useMemo(() => getHierarchyRacks(hierarchy, selectedZoneId), [hierarchy, selectedZoneId]);

  // Barcode is only enabled once warehouse+zone+rack are selected (for FG)
  const barcodeReady = !isFG || (!!selectedWarehouseId && !!selectedZoneId && !!selectedRackId);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Store Issue Approval - ${processId}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
        th { background: #e5f0f7; font-weight: 600; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; }
        .meta-field { display: flex; gap: 8px; }
        .meta-label { color: #666; min-width: 110px; }
        h2 { font-size: 15px; margin: 0 0 16px; }
        .stamp { color: #d97706; border: 2px solid #d97706; padding: 4px 8px; display: inline-block; transform: rotate(-12deg); font-weight: 800; font-size: 9px; letter-spacing: 0.12em; margin-bottom: 8px; }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">

          {/* ── Header bar ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white shrink-0 relative">
            <ApprovedStamp />
            <DialogHeader className="ml-24">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Store Entry/Issue Approval &nbsp;
                <span className="text-[#105076]">({processId})</span>
              </DialogTitle>
            </DialogHeader>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#105076] hover:bg-[#0d4566] text-white text-xs font-semibold h-8 px-4 shrink-0">
                  OTHER ACTIONS
                  <ChevronDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 text-gray-500" />
                  Print
                </DropdownMenuItem>

                <DropdownMenuItem
                  className={`flex items-center gap-2 text-sm ${
                    canBarcode && barcodeReady
                      ? "cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                  }`}
                  disabled={!canBarcode || !barcodeReady}
                  onSelect={(e) => {
                    if (!canBarcode || !barcodeReady) { e.preventDefault(); return; }
                    setBarcodeOpen(true);
                  }}
                >
                  <Barcode className="h-4 w-4" />
                  Add Barcode Number
                  {canBarcode && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      sourceType === "FG"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {sourceType}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5" ref={printRef}>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 mb-6 border-b pb-5">
              <div className="space-y-1.5">
                <MetaField label="Document Type"   value={meta.documentType} />
                <MetaField label="Document Action" value={meta.documentAction} />
                <MetaField label="Created By"      value={meta.createdBy} />
                <MetaField label="Approved By"     value={meta.approvedBy} />
                <MetaField label="Comment"         value={meta.comment} />
              </div>
              <div className="space-y-1.5">
                <MetaField label="Document Number" value={meta.documentNumber} />
                <MetaField label="No of Items"     value={meta.noOfItems} />
                <MetaField label="Creation Date"   value={meta.creationDate} />
                <MetaField label="Approval Date"   value={meta.approvalDate} />
                <MetaField label="Reference Id"    value={meta.referenceId} />
              </div>
            </div>

            {/* ── FG: Warehouse / Zone / Rack selector ── */}
            {isFG && (
              <div className="mb-5 p-4 rounded-lg border border-blue-100 bg-blue-50/40">
                {/* <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Select Destination Location for Barcode
                  </span>
                  <span className="text-[10px] text-blue-500">(required to enable barcode generation)</span>
                </div> */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Warehouse */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Warehouse <span className="text-red-500">*</span></label>
                    <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Zone */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Zone <span className="text-red-500">*</span></label>
                    {hierarchyLoading ? (
                      <div className="h-8 flex items-center gap-2 px-3 border rounded-md bg-white opacity-60 text-xs text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading…
                      </div>
                    ) : (
                      <Select
                        value={selectedZoneId}
                        onValueChange={setSelectedZoneId}
                        disabled={!selectedWarehouseId || zones.length === 0}
                      >
                        <SelectTrigger className="h-8 text-xs w-full">
                          <SelectValue placeholder={!selectedWarehouseId ? "Select warehouse first" : zones.length === 0 ? "No zones" : "Select zone"} />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem key={z.zoneId} value={String(z.zoneId)}>{z.zoneName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Rack */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Rack <span className="text-red-500">*</span></label>
                    <Select
                      value={selectedRackId}
                      onValueChange={setSelectedRackId}
                      disabled={!selectedZoneId || racks.length === 0}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder={!selectedZoneId ? "Select zone first" : racks.length === 0 ? "No racks" : "Select rack"} />
                      </SelectTrigger>
                      <SelectContent>
                        {racks.map((r) => (
                          <SelectItem key={r.rackId} value={String(r.rackId)}>{r.rackName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!barcodeReady && (
                  <p className="text-[11px] text-amber-600 mt-2">
                    ⚠ Select warehouse, zone and rack to enable barcode generation.
                  </p>
                )}
              </div>
            )}

            {/* Table */}
            {rows.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm border rounded-lg">
                No changed items to display
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs min-w-[1000px]">
                  <thead>
                    <tr style={{ backgroundColor: "#b2d8e8" }}>
                      {[
                        "#", "ITEM ID", "DESCRIPTION", "PRODUCT CATEGORY",
                        "ACTION", "FROM STORE", "TO STORE",
                        "DOCUMENT QUANTITY", "APPROVED QUANTITY",
                        "UNIT", "BASE QUANTITY", "BASE UNIT",
                        "CURRENT STOCK", "COMMENT",
                        ...(isRM ? ["BATCH"] : []),
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 text-left font-semibold text-gray-700 border-r last:border-r-0 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2.5 border-r text-gray-500 text-center">{row.seq}</td>
                        <td className="px-3 py-2.5 border-r text-blue-600 font-medium whitespace-nowrap">{row.itemId}</td>
                        <td className="px-3 py-2.5 border-r whitespace-nowrap">{row.description}</td>
                        <td className="px-3 py-2.5 border-r text-gray-600">{row.productCategory || "—"}</td>
                        <td className="px-3 py-2.5 border-r whitespace-nowrap font-medium text-gray-700">{row.action}</td>
                        <td className="px-3 py-2.5 border-r whitespace-nowrap text-blue-700">{row.fromStore || "—"}</td>
                        <td className="px-3 py-2.5 border-r whitespace-nowrap text-blue-700">{row.toStore || "—"}</td>
                        <td className="px-3 py-2.5 border-r text-center font-medium">{row.documentQuantity}</td>
                        <td className="px-3 py-2.5 border-r text-center font-medium">{row.approvedQuantity}</td>
                        <td className="px-3 py-2.5 border-r text-center text-blue-600 font-medium">{row.unit}</td>
                        <td className="px-3 py-2.5 border-r text-center">{row.baseQuantity}</td>
                        <td className="px-3 py-2.5 border-r text-center">{row.baseUnit}</td>
                        <td className={`px-3 py-2.5 border-r text-center font-medium ${row.currentStock < 0 ? "text-red-600" : "text-gray-700"}`}>
                          {row.currentStock.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 border-r text-gray-500">{row.comment || "—"}</td>
                        {isRM && (
                          <td className="px-3 py-2.5 min-w-[120px]">
                            <Input
                              value={batchMap[i] ?? ""}
                              onChange={(e) => setBatchMap((p) => ({ ...p, [i]: e.target.value }))}
                              placeholder="Batch no."
                              className="h-7 text-xs border-gray-300"
                            />
                          </td>
                        )}
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
                  <span>1–{rows.length} of {rows.length}</span>
                  <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>◀</button>
                  <button className="px-1 rounded hover:bg-gray-200 disabled:opacity-40" disabled>▶</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="border-t bg-white px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Document Approved
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── BarcodeDialog ── */}
      {canBarcode && (
        <BarcodeDialog
          open={barcodeOpen}
          onOpenChange={setBarcodeOpen}
          sourceType={sourceType}
          grnId={sourceType === "GRN" ? meta.grnId : undefined}
          productionId={sourceType === "FG" ? meta.productionId : undefined}
          warehouseId={sourceType === "FG" ? Number(selectedWarehouseId) || meta.fgStoreId : undefined}
          zoneId={sourceType === "FG" ? Number(selectedZoneId) || undefined : undefined}
          rackId={sourceType === "FG" ? Number(selectedRackId) || undefined : undefined}
          items={toBarcodeItems(rows, sourceType)}
          referenceLabel={processId}
        />
      )}
    </>
  );
};

export default StoreIssueApprovalDialog;
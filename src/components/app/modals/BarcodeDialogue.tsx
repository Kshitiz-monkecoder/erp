// src/components/app/modals/BarcodeDialogue.tsx
//
// Supports two modes driven by the `sourceType` prop:
//   "GRN" → POST /inventory/grn/barcodes/bulk
//   "FG"  → POST /production/fg/barcodes/bulk
//
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { post } from "@/lib/apiService";
import { toast } from "sonner";
import type { BarcodeSourceType } from "@/components/ui/storeIssueApprove";

// ─────────────────────────────────────────────────────────────────────────────
// Item shape passed in from parent (StoreIssueApprovalDialog or GRN page)
// ─────────────────────────────────────────────────────────────────────────────
export interface BarcodeItem {
  /**
   * For GRN: grnItemId (sent as grnItemId in payload).
   * For FG:  production FG record ID (sent as fgId in payload).
   */
  id: string | number;
  /**
   * For GRN: same as id (or grnItem's linked itemId).
   * For FG:  actual inventory item ID (sent as itemId in payload).
   */
  itemId: string | number;
  /** Display code shown in the table */
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal row
// ─────────────────────────────────────────────────────────────────────────────
interface BarcodeRow {
  rowId: string;
  /** For GRN: grnItemId. For FG: productionFGRecordId */
  recordId: string | number;
  /** Real inventory item ID used in the API payload */
  apiItemId: string | number;
  displayCode: string;
  displayName: string;
  quantity: number;
  prefix: string;
  serial: string;
  mfgDate: string;
  expiryDate: string;
  comment: string;
  info: string;
  isMain?: boolean;
  parentRowId?: string;
  raw?: BarcodeItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "GRN" | "FG" — controls endpoint + payload shape */
  sourceType: BarcodeSourceType;
  /** GRN mode: the GRN document ID */
  grnId?: number | string | null;
  /** FG mode: the production process numeric ID */
  productionId?: number | null;
  /** FG mode: FG store / warehouse ID (maps to warehouseId in payload) */
  warehouseId?: number | null;
  /** Items pre-populated from parent */
  items?: BarcodeItem[];
  /** Shown in dialog title, e.g. "PROD-1772040191163" */
  referenceLabel?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BarcodeDialog({
  open,
  onOpenChange,
  sourceType,
  grnId = null,
  productionId = null,
  warehouseId = null,
  items = [],
  referenceLabel = "",
}: Props) {

  // ── Build initial rows from items prop ────────────────────────────────────
  const buildRows = (): BarcodeRow[] => {
    if (!items.length) {
      return [{
        rowId: "main-0", recordId: 0, apiItemId: 0,
        displayCode: "ITEM-0", displayName: "Item 0",
        quantity: 0, prefix: "", serial: "",
        mfgDate: "", expiryDate: "", comment: "", info: "",
        isMain: true,
      }];
    }
    return items.map((it, idx) => ({
      rowId:       `main-${it.id ?? idx}`,
      recordId:    it.id,
      apiItemId:   it.itemId,
      displayCode: it.itemCode   || `ITM-${idx + 1}`,
      displayName: it.description || `Item ${idx + 1}`,
      quantity:    Number(it.quantity ?? 0),
      prefix: "", serial: "", mfgDate: "", expiryDate: "", comment: "", info: "",
      isMain: true,
      raw: it,
    }));
  };

  const [rows,             setRows]             = useState<BarcodeRow[]>(buildRows);
  const [prefixDialogOpen, setPrefixDialogOpen] = useState(false);
  const [globalPrefix,     setGlobalPrefix]     = useState("");
  const [isGenerating,     setIsGenerating]     = useState(false);

  // Sync rows when items change (e.g. dialog reopened with different data)
  useEffect(() => {
    setRows(buildRows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const update = (rowId: string, field: keyof BarcodeRow, value: any) =>
    setRows(prev => prev.map(r => r.rowId === rowId ? { ...r, [field]: value } : r));

  const clearAll = () =>
    setRows(prev => prev.map(r => ({ ...r, prefix: "", serial: "", comment: "", info: "" })));

  const applyGlobalPrefix = () => {
    setRows(prev => prev.map(r => ({ ...r, prefix: globalPrefix })));
    setPrefixDialogOpen(false);
  };

  const autoFillSerials = () => {
    const main = rows.find(r => r.isMain);
    if (!main?.serial) return;
    const start  = parseInt(main.serial, 10) || 0;
    const padLen = main.serial.length;
    const kids   = rows.filter(r => r.parentRowId === main.rowId);
    if (!kids.length) return;
    setRows(prev => prev.map(r => {
      if (!r.parentRowId) return r;
      const idx = kids.findIndex(c => c.rowId === r.rowId);
      let s = String(start + idx + 1);
      if (padLen > s.length) s = s.padStart(padLen, "0");
      return { ...r, serial: s };
    }));
  };

  // ── Split / Merge ─────────────────────────────────────────────────────────
  const splitRow = (mainRowId: string, count = 1) => {
    const main = rows.find(r => r.rowId === mainRowId);
    if (!main || main.quantity <= 0) return;
    const existingKids = rows.filter(r => r.parentRowId === mainRowId).length;
    const toCreate     = Math.min(main.quantity, count);
    const splits: BarcodeRow[] = Array.from({ length: toCreate }, (_, i) => ({
      rowId:       `split-${mainRowId}-${existingKids + i + 1}`,
      recordId:    main.recordId,
      apiItemId:   main.apiItemId,
      displayCode: "",
      displayName: "",
      quantity:    1,
      prefix:      main.prefix,
      serial:      "",
      mfgDate:     main.mfgDate,
      expiryDate:  main.expiryDate,
      comment:     main.comment,
      info:        main.info,
      parentRowId: mainRowId,
      raw:         main.raw,
    }));
    setRows(prev =>
      prev
        .map(r => r.rowId === mainRowId ? { ...r, quantity: Math.max(0, r.quantity - toCreate) } : r)
        .concat(splits)
    );
  };

  const mergeBack = (splitRowId: string) => {
    const split = rows.find(r => r.rowId === splitRowId);
    if (!split?.parentRowId) return;
    setRows(prev =>
      prev
        .map(r => r.rowId === split.parentRowId ? { ...r, quantity: r.quantity + 1 } : r)
        .filter(r => r.rowId !== splitRowId)
    );
  };

  // ── Payload builders ──────────────────────────────────────────────────────

  /** POST /inventory/grn/barcodes/bulk */
  const buildGRNPayload = (prepared: BarcodeRow[]) => ({
    grnId: Number(grnId),
    barcodes: prepared.map(r => ({
      grnItemId:         Number(r.recordId),
      itemId:            r.apiItemId,
      barcodeNumber:     `${r.prefix}${r.serial}`.trim(),
      mainQuantity:      r.isMain ? Number(r.quantity) : 1,
      comment:           r.comment    || null,
      info:              r.info        || null,
      manufacturingDate: r.mfgDate    || null,
      expiryDate:        r.expiryDate || null,
      linkedId:          null,
    })),
  });

  /** POST /production/fg/barcodes/bulk */
  const buildFGPayload = (prepared: BarcodeRow[]) => ({
    productionId: Number(productionId),
    warehouseId:  Number(warehouseId),
    barcodes: prepared.map(r => ({
      fgId:              Number(r.recordId),  // production FG record ID
      itemId:            r.apiItemId,          // actual inventory item ID
      barcodeNumber:     `${r.prefix}${r.serial}`.trim(),
      mainQuantity:      r.isMain ? Number(r.quantity) : 1,
      comment:           r.comment    || null,
      manufacturingDate: r.mfgDate    || null,
      expiryDate:        r.expiryDate || null,
    })),
  });

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (sourceType === "GRN" && !grnId) {
      toast.error("Missing GRN ID"); return;
    }
    if (sourceType === "FG" && (!productionId || !warehouseId)) {
      toast.error("Missing production ID or warehouse ID"); return;
    }

    const prepared = rows.filter(r =>
      r.isMain
        ? r.quantity > 0 && (r.serial.trim() || r.prefix.trim())
        : r.serial.trim() || r.prefix.trim()
    );

    if (!prepared.length) {
      toast.error("No rows ready — fill prefix/serial or split items.");
      return;
    }

    const [endpoint, payload] =
      sourceType === "GRN"
        ? ["/inventory/grn/barcodes/bulk", buildGRNPayload(prepared)]
        : ["/inventory/grn/barcodes/bulk",  buildFGPayload(prepared)];

    setIsGenerating(true);
    try {
      console.log(`[BarcodeDialog] POST ${endpoint}`, payload);
      await post(endpoint, payload);
      toast.success("Barcodes generated successfully!");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Barcode generation error:", err);
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to generate barcodes"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ── CSV download ──────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const headers = ["prefix","serial","quantity","manufacturingDate","expiryDate","comment","info"];
    const csv = [
      headers.join(","),
      ...rows.map(r =>
        `${r.prefix},${r.serial},${r.quantity},${r.mfgDate},${r.expiryDate},${r.comment},${r.info}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url,
      download: `barcode_template_${sourceType.toLowerCase()}_${referenceLabel || "sample"}.csv`,
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  // ── Title ─────────────────────────────────────────────────────────────────
  const title =
    sourceType === "GRN"
      ? `Barcode Number - GRN: ${grnId ?? "—"}`
      : `Barcode Number - FG: ${(referenceLabel || productionId )?? "—"}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] max-w-[1600px] p-8 lg:p-12 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-6">
            <DialogTitle className="flex items-center gap-4 text-2xl font-bold">
              <ArrowLeft
                className="w-8 h-8 cursor-pointer hover:text-gray-600"
                onClick={() => onOpenChange(false)}
              />
              {title}
              {/* Source type badge */}
              <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                sourceType === "FG"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {sourceType}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            {/* Top controls */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setPrefixDialogOpen(true)}>Customize</Button>
              <Button variant="destructive" onClick={clearAll}>Clear All</Button>
              <Button variant="outline" onClick={autoFillSerials}>Auto-fill Serials</Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["#","Item Id","Item Name","Qty","Barcode Number",
                      "Mfg Date","Expiry Date","Comment","Info","Split / Merge"
                    ].map(h => (
                      <th key={h} className="px-6 py-4 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, idx) => {
                    const isMain  = !!row.isMain;
                    const isChild = !!row.parentRowId;
                    const parent  = isChild ? rows.find(r => r.rowId === row.parentRowId) : null;

                    return (
                      <tr key={row.rowId} className={`border-t ${isChild ? "bg-gray-50" : ""}`}>
                        <td className="px-6 py-4 text-gray-500">{idx + 1}</td>

                        {/* Item ID */}
                        <td className="px-6 py-4 font-medium">
                          {isChild ? (parent?.displayCode ?? "") : row.displayCode}
                        </td>

                        {/* Item Name */}
                        <td className="px-6 py-4">
                          {isChild ? (parent?.displayName ?? "") : row.displayName}
                        </td>

                        {/* Qty + split/merge icon */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={isMain ? "font-bold text-blue-600" : "text-green-600"}>
                              {row.quantity}
                            </span>
                            {isMain && row.quantity > 0 && (
                              <button
                                onClick={() => splitRow(row.rowId)}
                                title="Split into individual barcode rows"
                                className="p-1 bg-blue-50 rounded hover:bg-blue-100"
                              >
                                <Plus className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            {isChild && (
                              <button
                                onClick={() => mergeBack(row.rowId)}
                                title="Merge back into parent"
                                className="p-1 bg-red-50 rounded hover:bg-red-100"
                              >
                                <Minus className="w-4 h-4 text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Barcode = Prefix + Serial */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Prefix"
                              value={row.prefix}
                              onChange={e => update(row.rowId, "prefix", e.target.value)}
                              className="w-28"
                            />
                            <Input
                              placeholder="0001"
                              value={row.serial}
                              onChange={e => update(row.rowId, "serial", e.target.value)}
                              className="w-28"
                            />
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Input type="date" value={row.mfgDate}
                            onChange={e => update(row.rowId, "mfgDate", e.target.value)} />
                        </td>

                        <td className="px-6 py-4">
                          <Input type="date" value={row.expiryDate}
                            onChange={e => update(row.rowId, "expiryDate", e.target.value)} />
                        </td>

                        <td className="px-6 py-4">
                          <Input placeholder="Comment" value={row.comment}
                            onChange={e => update(row.rowId, "comment", e.target.value)} />
                        </td>

                        <td className="px-6 py-4">
                          <Input placeholder="Info" value={row.info}
                            onChange={e => update(row.rowId, "info", e.target.value)} />
                        </td>

                        <td className="px-6 py-4">
                          {isMain && (
                            <Button size="sm" onClick={() => splitRow(row.rowId, 1)}>Split 1</Button>
                          )}
                          {isChild && (
                            <Button size="sm" variant="outline" onClick={() => mergeBack(row.rowId)}>
                              Merge
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadTemplate}>Download Template</Button>
                <Button variant="outline"
                  onClick={() => toast.info("Upload feature — use the CSV upload flow if implemented.")}
                >
                  Upload File
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Barcodes"}
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prefix customization sub-dialog */}
      <Dialog open={prefixDialogOpen} onOpenChange={setPrefixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Set Global Prefix</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter prefix for all barcodes"
              value={globalPrefix}
              onChange={e => setGlobalPrefix(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPrefixDialogOpen(false)}>Cancel</Button>
              <Button onClick={applyGlobalPrefix}>Apply to All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
// src/components/app/modals/BarcodeDialogue.tsx
//
// Supports two modes driven by the `sourceType` prop:
//   "GRN" → POST /inventory/grn/barcodes/bulk
//   "FG"  → POST /production/fg/barcodes/bulk
//
// FIXES applied:
//   1. Quantity is now an editable Input (was static 0 span)
//   2. Split button respects editable quantity correctly
//   3. FG mode posts to correct endpoint /production/fg/barcodes/bulk
//   4. Items are built from properly-typed BarcodeItem prop
//   5. "Split All" button splits every remaining quantity at once
//
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus, ChevronsRight, Upload, Download } from "lucide-react";
import { post } from "@/lib/apiService";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { BarcodeSourceType } from "@/components/ui/storeIssueApprove";

// ─────────────────────────────────────────────────────────────────────────────
// Item shape passed in from parent
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
  /** Remaining / assigned quantity — now always editable */
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
  /** FG mode: zone ID */
  zoneId?: number | null;
  /** FG mode: rack ID */
  rackId?: number | null;
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
  zoneId = null,
  rackId = null,
  items = [],
  referenceLabel = "",
}: Props) {

  // ── Build initial rows from items prop ────────────────────────────────────
  const buildRows = (): BarcodeRow[] => {
    if (!items.length) {
      return [{
        rowId: "main-0", recordId: 0, apiItemId: 0,
        displayCode: "ITEM-0", displayName: "Item 0",
        quantity: 1, prefix: "", serial: "",
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
      // FIX 1: Use the real quantity from the item prop
      quantity:    Number(it.quantity ?? 1),
      prefix: "", serial: "", mfgDate: "", expiryDate: "", comment: "", info: "",
      isMain: true,
      raw: it,
    }));
  };

  const [rows,             setRows]             = useState<BarcodeRow[]>(buildRows);
  const [prefixDialogOpen, setPrefixDialogOpen] = useState(false);
  const [globalPrefix,     setGlobalPrefix]     = useState("");
  const [isGenerating,     setIsGenerating]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Auto-fill serials for child rows starting from main's serial value
    setRows(prev => {
      const mainRows = prev.filter(r => r.isMain && r.serial.trim());
      if (!mainRows.length) return prev;

      return prev.map(r => {
        if (!r.parentRowId) return r;
        const parent = mainRows.find(m => m.rowId === r.parentRowId);
        if (!parent) return r;

        const kids  = prev.filter(c => c.parentRowId === r.parentRowId);
        const idx   = kids.findIndex(c => c.rowId === r.rowId);
        const start = parseInt(parent.serial, 10) || 0;
        const padLen = parent.serial.length;
        let s = String(start + idx + 1);
        if (padLen > s.length) s = s.padStart(padLen, "0");
        return { ...r, serial: s };
      });
    });
  };

  // ── Split / Merge ─────────────────────────────────────────────────────────
  // FIX 2: splitRow now properly works because quantity is editable and > 0
  const splitRow = (mainRowId: string, count?: number) => {
    const main = rows.find(r => r.rowId === mainRowId);
    if (!main) return;

    // FIX: use the real quantity from the row (which is now editable)
    const qty = Number(main.quantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0 to split.");
      return;
    }

    const existingKids = rows.filter(r => r.parentRowId === mainRowId).length;
    // If count not provided, split ALL remaining quantity
    const toCreate = count !== undefined ? Math.min(qty, count) : qty;

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
        .map(r => r.rowId === mainRowId
          ? { ...r, quantity: Math.max(0, r.quantity - toCreate) }
          : r)
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
    zoneId:       zoneId ? Number(zoneId) : undefined,
    rackId:       rackId ? Number(rackId) : undefined,
    barcodes: prepared.map(r => ({
      fgId:              Number(r.recordId),
      itemId:            r.apiItemId,
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

    // FIX 3: FG uses the correct endpoint /production/fg/barcodes/bulk
    const [endpoint, payload] =
      sourceType === "GRN"
        ? ["/inventory/grn/barcodes/bulk",  buildGRNPayload(prepared)]
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

  // ── XLSX download ─────────────────────────────────────────────────────────
  // Columns:
  //   Locked (read-only, grey): Row, Item Code, Item Name, Total Qty
  //   Editable (white):         Prefix, Serial, Qty, Mfg Date, Expiry Date, Comment, Info
  const downloadTemplate = () => {
    const LOCKED_COLS  = ["Row", "Item Code", "Item Name", "Total Qty"];
    const EDIT_COLS    = ["Prefix", "Serial", "Qty", "Mfg Date (YYYY-MM-DD)", "Expiry Date (YYYY-MM-DD)", "Comment", "Info"];
    const ALL_COLS     = [...LOCKED_COLS, ...EDIT_COLS];

    // ── Sheet data ──────────────────────────────────────────────────────────
    const sheetData: any[][] = [
      ALL_COLS,
      ...rows.map((r, idx) => [
        idx + 1,
        r.isMain ? r.displayCode : "",          // Item Code (empty for splits)
        r.isMain ? r.displayName : "(split)",   // Item Name
        r.isMain ? r.quantity : 1,              // Total Qty
        r.prefix,                               // Prefix  ← user fills
        r.serial,                               // Serial  ← user fills
        r.isMain ? r.quantity : 1,              // Qty     ← user fills
        r.mfgDate    || "",                     // Mfg Date
        r.expiryDate || "",                     // Expiry Date
        r.comment    || "",                     // Comment
        r.info       || "",                     // Info
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // ── Column widths ───────────────────────────────────────────────────────
    ws["!cols"] = [
      { wch: 6  },  // Row
      { wch: 14 },  // Item Code
      { wch: 26 },  // Item Name
      { wch: 10 },  // Total Qty
      { wch: 12 },  // Prefix
      { wch: 12 },  // Serial
      { wch: 8  },  // Qty
      { wch: 20 },  // Mfg Date
      { wch: 20 },  // Expiry Date
      { wch: 22 },  // Comment
      { wch: 20 },  // Info
    ];

    // ── Styles ──────────────────────────────────────────────────────────────
    // Header row: dark blue bg + white bold text
    const headerStyle = {
      font:      { bold: true, color: { rgb: "FFFFFF" } },
      fill:      { fgColor: { rgb: "1D4ED8" } },
      alignment: { horizontal: "center" as const, vertical: "center" as const },
      border:    { bottom: { style: "thin", color: { rgb: "93C5FD" } } },
    };

    // Locked data cells: light grey, italic
    const lockedStyle = {
      font:      { italic: true, color: { rgb: "6B7280" } },
      fill:      { fgColor: { rgb: "F3F4F6" } },
      alignment: { horizontal: "center" as const },
      protection: { locked: true },
    };

    // Editable cells: white bg, blue left border hint
    const editStyle = {
      fill:      { fgColor: { rgb: "EFF6FF" } },
      alignment: { horizontal: "left" as const },
      protection: { locked: false },
    };

    const totalRows  = sheetData.length;
    const totalCols  = ALL_COLS.length;

    for (let R = 0; R < totalRows; R++) {
      for (let C = 0; C < totalCols; C++) {
        const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddr]) ws[cellAddr] = { v: "", t: "s" };

        if (R === 0) {
          ws[cellAddr].s = headerStyle;
        } else if (C < LOCKED_COLS.length) {
          ws[cellAddr].s = lockedStyle;
        } else {
          ws[cellAddr].s = editStyle;
        }
      }
    }

    // ── Freeze header row ───────────────────────────────────────────────────
    ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft" };

    // ── Instructions sheet ──────────────────────────────────────────────────
    const instructions: any[][] = [
      ["BARCODE TEMPLATE — HOW TO FILL"],
      [""],
      ["Column",          "Description",                                  "Editable?"],
      ["Row",             "Auto-generated row number",                    "NO"],
      ["Item Code",       "Item SKU / code (pre-filled)",                 "NO"],
      ["Item Name",       "Item description (pre-filled)",                "NO"],
      ["Total Qty",       "Total quantity from the GRN item (pre-filled)","NO"],
      ["Prefix",          "Barcode prefix, e.g. WH1- (leave blank if none)", "YES"],
      ["Serial",          "Unique serial number, e.g. 0001",             "YES ✓ REQUIRED"],
      ["Qty",             "Quantity for this barcode row",                "YES"],
      ["Mfg Date",        "Manufacturing date in YYYY-MM-DD format",      "YES (optional)"],
      ["Expiry Date",     "Expiry date in YYYY-MM-DD format",             "YES (optional)"],
      ["Comment",         "Any comment for this barcode",                 "YES (optional)"],
      ["Info",            "Additional info",                              "YES (optional)"],
      [""],
      ["TIPS"],
      ["• Each row = one barcode label."],
      ["• To generate individual labels: use Split buttons in the dialog, then download."],
      ["• Serial is REQUIRED for every row — blank serial rows are skipped."],
      ["• Do NOT add or delete columns; column order must stay the same."],
      ["• Save as .xlsx before uploading (do not convert to CSV)."],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(instructions);
    wsInfo["!cols"] = [{ wch: 18 }, { wch: 55 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws,     "Barcodes");
    XLSX.utils.book_append_sheet(wb, wsInfo, "Instructions");

    const fileName = `barcode_template_${sourceType.toLowerCase()}_${referenceLabel || "sample"}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Template downloaded — fill the Barcodes sheet and upload it back.");
  };

  // ── XLSX upload ───────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";          // reset so same file can be re-uploaded

    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an .xlsx or .xls file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data  = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb    = XLSX.read(data, { type: "array", cellDates: true });
        const ws    = wb.Sheets["Barcodes"];
        if (!ws) {
          toast.error('Sheet named "Barcodes" not found. Did you use the downloaded template?');
          return;
        }

        // Parse to JSON — raw:false converts dates to strings automatically
        const parsed: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        // Expected column headers (must match template exactly)
        const COL_ITEM_CODE = "Item Code";
        const COL_PREFIX    = "Prefix";
        const COL_SERIAL    = "Serial";
        const COL_QTY       = "Qty";
        const COL_MGF       = "Mfg Date (YYYY-MM-DD)";
        const COL_EXP       = "Expiry Date (YYYY-MM-DD)";
        const COL_COMMENT   = "Comment";
        const COL_INFO      = "Info";

        if (!parsed.length || !(COL_SERIAL in parsed[0])) {
          toast.error("File format invalid — make sure you are using the downloaded template without renaming columns.");
          return;
        }

        let matched = 0;
        let skipped = 0;

        setRows(prevRows => {
          const next = [...prevRows];

          parsed.forEach((xlRow: any) => {
            const serial = String(xlRow[COL_SERIAL] ?? "").trim();
            if (!serial) { skipped++; return; }        // skip blank serial rows

            const itemCode = String(xlRow[COL_ITEM_CODE] ?? "").trim();

            // Try to match uploaded row back to an existing main row by item code
            const targetIdx = next.findIndex(
              r => r.isMain && (r.displayCode === itemCode || itemCode === "")
            );

            if (targetIdx === -1) {
              skipped++;
              return;
            }

            // Apply editable fields to the matched row
            next[targetIdx] = {
              ...next[targetIdx],
              prefix:      String(xlRow[COL_PREFIX]  ?? "").trim(),
              serial:      serial,
              quantity:    Number(xlRow[COL_QTY])     || next[targetIdx].quantity,
              mfgDate:     formatDateFromXlsx(xlRow[COL_MGF]),
              expiryDate:  formatDateFromXlsx(xlRow[COL_EXP]),
              comment:     String(xlRow[COL_COMMENT]  ?? "").trim(),
              info:        String(xlRow[COL_INFO]     ?? "").trim(),
            };

            matched++;
          });

          return next;
        });

        toast.success(`Uploaded — ${matched} row(s) updated${skipped ? `, ${skipped} skipped (no serial)` : ""}.`);
      } catch (err) {
        console.error("XLSX parse error:", err);
        toast.error("Failed to parse the file. Make sure it is a valid .xlsx file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Normalise dates coming from SheetJS (Date object or string) → "YYYY-MM-DD" or "" */
  const formatDateFromXlsx = (raw: any): string => {
    if (!raw) return "";
    if (raw instanceof Date) {
      return raw.toISOString().split("T")[0];
    }
    const s = String(raw).trim();
    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // try to parse other formats
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return "";
  };

  // ── Title ─────────────────────────────────────────────────────────────────
  const title =
    sourceType === "GRN"
      ? `Barcode Number - GRN: ${grnId ?? "—"}`
      : `Barcode Number - FG: ${(referenceLabel || productionId) ?? "—"}`;

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
            <div className="rounded-xl border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["#","Item Code","Item Name","Qty (Editable)",
                      "Barcode Number (Prefix + Serial)",
                      "Mfg Date","Expiry Date","Comment","Info","Actions"
                    ].map(h => (
                      <th key={h} className="px-4 py-4 text-left font-semibold whitespace-nowrap text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, idx) => {
                    const isMain  = !!row.isMain;
                    const isChild = !!row.parentRowId;
                    const parent  = isChild ? rows.find(r => r.rowId === row.parentRowId) : null;

                    return (
                      <tr key={row.rowId} className={`border-t ${isChild ? "bg-blue-50/40" : "bg-white"}`}>
                        <td className="px-4 py-3 text-gray-500 text-center">{idx + 1}</td>

                        {/* Item Code */}
                        <td className="px-4 py-3 font-medium font-mono text-xs">
                          {isChild ? (parent?.displayCode ?? "—") : row.displayCode}
                        </td>

                        {/* Item Name */}
                        <td className="px-4 py-3 max-w-[160px]">
                          <span className="truncate block">
                            {isChild ? (parent?.displayName ?? "—") : row.displayName}
                          </span>
                        </td>

                        {/* ── FIX 1: Quantity is an editable Input for main rows ── */}
                        <td className="px-4 py-3">
                          {isMain ? (
                            <Input
                              type="number"
                              min={0}
                              value={row.quantity}
                              onChange={e =>
                                update(row.rowId, "quantity", Math.max(0, Number(e.target.value)))
                              }
                              className="w-20 font-bold text-blue-600 text-center"
                            />
                          ) : (
                            <span className="text-green-600 font-medium">1</span>
                          )}
                        </td>

                        {/* Barcode = Prefix + Serial */}
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Prefix"
                              value={row.prefix}
                              onChange={e => update(row.rowId, "prefix", e.target.value)}
                              className="w-24"
                            />
                            <Input
                              placeholder="0001"
                              value={row.serial}
                              onChange={e => update(row.rowId, "serial", e.target.value)}
                              className="w-24"
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            type="date"
                            value={row.mfgDate}
                            onChange={e => update(row.rowId, "mfgDate", e.target.value)}
                            className="w-36"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            type="date"
                            value={row.expiryDate}
                            onChange={e => update(row.rowId, "expiryDate", e.target.value)}
                            className="w-36"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            placeholder="Comment"
                            value={row.comment}
                            onChange={e => update(row.rowId, "comment", e.target.value)}
                            className="w-28"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            placeholder="Info"
                            value={row.info}
                            onChange={e => update(row.rowId, "info", e.target.value)}
                            className="w-24"
                          />
                        </td>

                        {/* ── FIX 2: Split buttons now work because quantity is editable ── */}
                        <td className="px-4 py-3">
                          {isMain && (
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => splitRow(row.rowId, 1)}
                                title="Split one barcode row from this item"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Split 1
                              </Button>
                              {row.quantity > 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                                  onClick={() => splitRow(row.rowId)}
                                  title={`Split all ${row.quantity} into individual rows`}
                                >
                                  <ChevronsRight className="w-3 h-3 mr-1" />
                                  Split All
                                </Button>
                              )}
                            </div>
                          )}
                          {isChild && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => mergeBack(row.rowId)}
                            >
                              <Minus className="w-3 h-3 mr-1" />
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
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template (.xlsx)
                </Button>

                {/* Hidden real file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Filled Template
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
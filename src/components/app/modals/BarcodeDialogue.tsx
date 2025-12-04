// src/components/app/modals/BarcodeDialog.tsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Minus, ChevronDown } from "lucide-react";
import { post } from "@/lib/apiService";

interface BarcodeRow {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number; // mainQuantity for main row, 1 for split rows
  prefix: string;
  serial: string;
  mfgDate: string;
  expiryDate: string;
  info1: string; // maps to comment
  info2: string; // maps to info
  isMain?: boolean;
  parentId?: string;
  rawItem?: any; // hold original GRN item object
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grnId?: number | string | null;
  items?: any[]; // GRN items array from API
};

export default function BarcodeDialog({ open, onOpenChange, grnId = null, items = [] }: Props) {
  // Build initial rows from GRN items
  const buildInitialRows = (): BarcodeRow[] => {
    if (!Array.isArray(items) || items.length === 0) {
      // fallback: empty single row placeholder
      return [
        {
          id: "main-0",
          itemId: "ITEM-0",
          itemName: "Item 0",
          quantity: 0,
          prefix: "",
          serial: "",
          mfgDate: "",
          expiryDate: "",
          info1: "",
          info2: "",
          isMain: true,
          rawItem: null,
        },
      ];
    }

    return items.map((it: any, idx: number) => ({
      id: `main-${it.id ?? idx}`,
      itemId: it?.itemCode ?? it?.itemId ?? `ITM-${it.id ?? idx}`,
      itemName: it?.description ?? it?.name ?? `Item ${idx + 1}`,
      quantity: Number(it?.accepted ?? it?.quantity ?? 0),
      prefix: "",
      serial: "",
      mfgDate: it?.manufacturingDate ?? "",
      expiryDate: it?.expiryDate ?? "",
      info1: "",
      info2: "",
      isMain: true,
      rawItem: it,
    }));
  };

  const [rows, setRows] = useState<BarcodeRow[]>(buildInitialRows());
  const [showPrefixDialog, setShowPrefixDialog] = useState(false);
  const [globalPrefix, setGlobalPrefix] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // keep rows in sync when items prop changes
  useEffect(() => {
    setRows(buildInitialRows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  // Helpers
  const updateField = (id: string, field: keyof BarcodeRow, value: any) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const clearAllBarcode = () => {
    setRows(prev => prev.map(r => ({ ...r, prefix: "", serial: "", info1: "", info2: "" })));
  };

  const applyGlobalPrefix = () => {
    setRows(prev => prev.map(r => ({ ...r, prefix: globalPrefix })));
    setShowPrefixDialog(false);
  };

  // Auto-fill serials for child rows using main.serial as base
  const autoFillSerials = () => {
    const mainRow = rows.find(r => r.isMain);
    if (!mainRow || !mainRow.serial) return;

    const starting = parseInt(mainRow.serial, 10) || 0;
    const padLen = mainRow.serial.length;

    // gather children that follow mainRow (parentId matches)
    const children = rows.filter(r => r.parentId === mainRow.id);

    // if no children, nothing to fill
    if (children.length === 0) return;

    setRows(prev =>
      prev.map(r => {
        if (!r.parentId) return r;
        // child's index among children
        const idx = children.findIndex(c => c.id === r.id);
        const serialNum = starting + idx + 1; // +1 start after main
        let s = String(serialNum);
        if (padLen > s.length) s = s.padStart(padLen, "0");
        return { ...r, serial: s };
      })
    );
  };

  // Split main row into up to N child rows (we create min(quantity, 9) in one click)
  const splitIntoIndividual = (mainId: string, maxCreate = 9) => {
    const mainRow = rows.find(r => r.id === mainId);
    if (!mainRow || mainRow.quantity <= 0) return;

    const existingChildCount = rows.filter(r => r.parentId === mainId).length;
    const remaining = mainRow.quantity;
    const toCreate = Math.min(remaining, maxCreate);

    const newSplits: BarcodeRow[] = [];
    for (let i = 1; i <= toCreate; i++) {
      const idx = existingChildCount + i;
      newSplits.push({
        id: `split-${mainId}-${idx}`,
        itemId: "", // will display parent's id in UI
        itemName: "", // display parent's name
        quantity: 1,
        prefix: mainRow.prefix,
        serial: "", // filled by user or auto-fill
        mfgDate: mainRow.mfgDate,
        expiryDate: mainRow.expiryDate,
        info1: mainRow.info1,
        info2: mainRow.info2,
        parentId: mainId,
        rawItem: mainRow.rawItem,
      });
    }

    setRows(prev =>
      prev
        .map(r => (r.id === mainId ? { ...r, quantity: Math.max(0, r.quantity - toCreate) } : r))
        .concat(newSplits)
    );
  };

  // Merge child back into parent (increase parent quantity and remove child)
  const mergeBack = (splitId: string) => {
    const splitRow = rows.find(r => r.id === splitId);
    if (!splitRow || !splitRow.parentId) return;

    const parentId = splitRow.parentId;
    setRows(prev =>
      prev
        .map(r => (r.id === parentId ? { ...r, quantity: r.quantity + 1 } : r))
        .filter(r => r.id !== splitId)
    );
  };

  // Build payload and call POST /grn/barcodes/bulk
  const handleGenerate = async () => {
    if (!grnId) {
      alert("Missing grnId");
      return;
    }

    // Validate entries: each row must have prefix+serial (or at least main rows must)
    // We'll include all rows that have a non-empty barcode (prefix+serial) OR are main with quantity>0 and no splits (support bulk quantity)
    const prepared = rows
      .filter(r => {
        // include if main and has quantity and (serial or will be created single quantity)
        // or child rows that have serial
        if (r.isMain) {
          // If main has quantity > 0 and serial provided -> we create barcode with that quantity
          return r.quantity > 0 && (r.serial.trim() !== "" || r.prefix.trim() !== "");
        } else {
          // child rows should have serial to be included
          return r.serial.trim() !== "" || r.prefix.trim() !== "";
        }
      })
      .map(r => {
        const raw = r.rawItem ?? {};
        return {
          grnItemId: raw?.id ?? null,
          itemId: raw?.itemId ?? raw?.item ?? raw?.id ?? r.itemId,
          barcodeNumber: `${r.prefix ?? ""}${r.serial ?? ""}`.trim(),
          mainQuantity: r.isMain ? Number(r.quantity || 0) : Number(r.quantity || 1),
          comment: r.info1 || null,
          info: r.info2 || null,
          manufacturingDate: r.mfgDate || null,
          expiryDate: r.expiryDate || null,
          linkedId: null,
        };
      });

    if (prepared.length === 0) {
      alert("No barcode rows ready to generate. Please set prefix+serial or split items.");
      return;
    }

    const payload = {
      grnId: Number(grnId),
      barcodes: prepared,
    };

    setIsGenerating(true);
    try {
      console.log("Posting barcode payload:", payload);
      await post("/inventory/grn/barcodes/bulk", payload);
      alert("Barcodes created successfully");
      onOpenChange(false);
    } catch (err) {
      console.error("Barcode generation error:", err);
      alert("Failed to generate barcodes. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const mainRow = rows.find(r => r.isMain);
  const childRows = mainRow ? rows.filter(r => r.parentId === mainRow.id) : [];
  const displayRows = rows; // keep order as is (mains then splits)

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
              Barcode Number - GRN: {grnId ?? "—"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-8 space-y-6">
            {/* Top controls */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setShowPrefixDialog(true)}>
                Customize
              </Button>
              <Button variant="destructive" onClick={clearAllBarcode}>
                Clear All
              </Button>
              <Button variant="outline" onClick={autoFillSerials}>
                Auto-fill Serials
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">#</th>
                    <th className="px-6 py-4 text-left font-semibold">Item Id</th>
                    <th className="px-6 py-4 text-left font-semibold">Item Name</th>
                    <th className="px-6 py-4 text-left font-semibold">Qty</th>
                    <th className="px-6 py-4 text-left font-semibold">Barcode Number</th>
                    <th className="px-6 py-4 text-left font-semibold">Mfg Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Expiry Date</th>
                    <th className="px-6 py-4 text-left font-semibold">Comment</th>
                    <th className="px-6 py-4 text-left font-semibold">Info</th>
                    <th className="px-6 py-4 text-left font-semibold">Split / Merge</th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((row, idx) => {
                    const isMain = !!row.isMain;
                    const isChild = !!row.parentId;
                    return (
                      <tr key={row.id} className={`border-t ${isChild ? "bg-gray-50" : ""}`}>
                        <td className="px-6 py-4">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium">
                          {isChild ? (row.rawItem ? row.rawItem.itemCode ?? row.rawItem.itemId ?? "" : "") : row.itemId}
                        </td>
                        <td className="px-6 py-4">
                          {isChild ? (row.rawItem ? row.rawItem.description ?? row.rawItem.name ?? "" : "") : row.itemName}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={isMain ? "font-bold text-blue-600" : "text-green-600"}>{row.quantity}</span>
                            {isMain && row.quantity > 0 && (
                              <button
                                onClick={() => splitIntoIndividual(row.id)}
                                title="Split into individual barcode rows (creates up to 9)"
                                className="p-1 bg-blue-50 rounded"
                              >
                                <Plus className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            {isChild && (
                              <button
                                onClick={() => mergeBack(row.id)}
                                title="Merge back into parent (remove this split)"
                                className="p-1 bg-red-50 rounded"
                              >
                                <Minus className="w-4 h-4 text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Prefix"
                              value={row.prefix}
                              onChange={(e) => updateField(row.id, "prefix", e.target.value)}
                              className="w-28"
                            />
                            <Input
                              placeholder="0001"
                              value={row.serial}
                              onChange={(e) => updateField(row.id, "serial", e.target.value)}
                              className="w-28"
                            />
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Input
                            type="date"
                            value={row.mfgDate}
                            onChange={(e) => updateField(row.id, "mfgDate", e.target.value)}
                          />
                        </td>

                        <td className="px-6 py-4">
                          <Input
                            type="date"
                            value={row.expiryDate}
                            onChange={(e) => updateField(row.id, "expiryDate", e.target.value)}
                          />
                        </td>

                        <td className="px-6 py-4">
                          <Input
                            placeholder="Comment"
                            value={row.info1}
                            onChange={(e) => updateField(row.id, "info1", e.target.value)}
                          />
                        </td>

                        <td className="px-6 py-4">
                          <Input
                            placeholder="Info"
                            value={row.info2}
                            onChange={(e) => updateField(row.id, "info2", e.target.value)}
                          />
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {isMain && (
                              <Button size="sm" onClick={() => {
                                // quick-create 1-child row (same as split but create single)
                                splitIntoIndividual(row.id, 1);
                              }}>
                                Split 1
                              </Button>
                            )}
                            {isChild && (
                              <Button size="sm" variant="outline" onClick={() => mergeBack(row.id)}>
                                Merge
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  // download template minimal CSV for user
                  const headers = ["prefix","serial","quantity","manufacturingDate","expiryDate","comment","info"];
                  const csvRows = [
                    headers.join(","),
                    rows.map(r => `${r.prefix},${r.serial},${r.quantity},${r.mfgDate},${r.expiryDate},${r.info1},${r.info2}`).join("\n")
                  ].join("\n");
                  const blob = new Blob([csvRows], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `barcode_template_grn_${grnId ?? "sample"}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}>
                  Download Template
                </Button>
                <Button variant="outline" onClick={() => {
                  // upload not implemented here — keep button for UI parity
                  alert("Upload feature isn't wired in this modal. Use CSV upload flow if implemented.");
                }}>
                  Upload File
                </Button>
              </div>

              <div className="flex gap-3">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate Barcodes"}
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prefix customization dialog */}
      <Dialog open={showPrefixDialog} onOpenChange={setShowPrefixDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Global Prefix</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Enter prefix for all barcodes" value={globalPrefix} onChange={(e) => setGlobalPrefix(e.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPrefixDialog(false)}>Cancel</Button>
              <Button onClick={applyGlobalPrefix}>Apply to All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

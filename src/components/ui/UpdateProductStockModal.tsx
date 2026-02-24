import React, { useRef, useState } from "react";
import { X, Download, Upload, Plus, Minus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockRow {
  id: string;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  unit: string;
  changeQuantity: number;
  defaultPrice: number;
  adjustmentType: string;
  comment: string;
}

export interface InventoryItemOption {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  defaultPrice: string;
  unit?: { name: string };
}

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItemOption[];
}

const ADJUSTMENT_TYPES = ["Purchase", "Sale", "Adjustment", "Return", "Damage", "Production", "Other"];
const TEMPLATE_HEADERS = ["Item ID", "Item Name", "Unit", "Change By Qty", "Final Qty", "Price", "Adjustment Type", "Comment"];

const generateId = () => Math.random().toString(36).slice(2, 9);

const emptyRow = (): StockRow => ({
  id: generateId(),
  itemId: "",
  itemName: "",
  currentQuantity: 0,
  unit: "Kg",
  changeQuantity: 0,
  defaultPrice: 0,
  adjustmentType: "Other",
  comment: "",
});

// ─── Download Template (browser-safe) ────────────────────────────────────────

const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    TEMPLATE_HEADERS,
    ["RM01", "Raw Material 1", "Kg", 0, "", 150, "Production", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 16 },
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "MySheet");

  // Use XLSX.write → Blob → anchor click (works in all browsers)
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk_manual_adjustment.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Component ────────────────────────────────────────────────────────────────

const UpdateProductStockModal: React.FC<IProps> = ({ isOpen, onClose, items = [] }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [store, setStore] = useState("Default Stock Store");
  const [useFIFO, setUseFIFO] = useState(true);
  const [globalComment, setGlobalComment] = useState("");
  const [rows, setRows] = useState<StockRow[]>([emptyRow()]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ── Row helpers ─────────────────────────────────────────────────────────────

  const updateRow = (id: string, field: keyof StockRow, value: string | number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "itemId" && typeof value === "string") {
          const match = items.find((i) => String(i.id) === value || i.sku === value);
          if (match) {
            updated.itemName = match.name;
            updated.currentQuantity = match.currentStock;
            updated.defaultPrice = Number(match.defaultPrice ?? 0);
            updated.unit = match.unit?.name ?? "Kg";
          }
        }
        return updated;
      })
    );
  };

  const incrementChange = (id: string) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, changeQuantity: r.changeQuantity + 1 } : r));

  const decrementChange = (id: string) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, changeQuantity: r.changeQuantity - 1 } : r));

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Upload Template ──────────────────────────────────────────────────────────

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (json.length < 2) { setUploadError("Template is empty or has no data rows."); return; }

        const headerRow = (json[0] as string[]).map((h) => String(h).toLowerCase().trim());
        const col = (name: string) => headerRow.indexOf(name.toLowerCase());

        const dataRows = json.slice(1).filter((r) => r.some((c) => c !== ""));
        if (dataRows.length === 0) { setUploadError("No data rows found in the uploaded file."); return; }

        const parsed: StockRow[] = dataRows.map((r) => {
          const itemId = String(r[col("item id")] ?? "");
          const matchedItem = items.find((i) => i.sku === itemId || String(i.id) === itemId);
          return {
            id: generateId(),
            itemId,
            itemName: String(r[col("item name")] ?? matchedItem?.name ?? ""),
            unit: String(r[col("unit")] ?? matchedItem?.unit?.name ?? "Kg"),
            changeQuantity: Number(r[col("change by qty")] ?? 0),
            currentQuantity: matchedItem?.currentStock ?? 0,
            defaultPrice: Number(r[col("price")] ?? matchedItem?.defaultPrice ?? 0),
            adjustmentType: String(r[col("adjustment type")] ?? "Other"),
            comment: String(r[col("comment")] ?? ""),
          };
        });

        setRows(parsed);
      } catch {
        setUploadError("Failed to parse file. Please use the downloaded template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleSave = () => {
    console.log({ store, useFIFO, globalComment, rows });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Update Product Stock</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Store + FIFO */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                To/From Store <span className="text-red-500">*</span>
              </label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-48"
              >
                <option>Default Stock Store</option>
                <option>Warehouse A</option>
                <option>Warehouse B</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useFIFO}
                onChange={(e) => setUseFIFO(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              Use FIFO Price (Price in Item table will be ignored)
            </label>
          </div>

          {/* Product Stock Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Product Stock Details</h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Template
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
            </div>

            {uploadError && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {uploadError}
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-10">No.</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-32">Item ID</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">Item Name</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-44">
                      <div className="flex items-center justify-center gap-1.5">
                        Current Quantity
                        <div className="flex gap-0.5">
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded flex items-center justify-center opacity-40"><Plus className="w-3 h-3" /></span>
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded flex items-center justify-center opacity-40"><Minus className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-44">Change Quantity</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-32">Final Quantity</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-28">Default Price</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">Adjustment Type</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">Comment</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-12">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const finalQty = row.currentQuantity + row.changeQuantity;
                    return (
                      <tr key={row.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 text-center text-gray-500 text-xs">{idx + 1}</td>

                        <td className="px-3 py-2.5">
                          {items.length > 0 ? (
                            <select
                              value={row.itemId}
                              onChange={(e) => updateRow(row.id, "itemId", e.target.value)}
                              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            >
                              <option value="">Select</option>
                              {items.map((item) => (
                                <option key={item.id} value={String(item.id)}>{item.sku}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={row.itemId}
                              onChange={(e) => updateRow(row.id, "itemId", e.target.value)}
                              placeholder="Item ID"
                              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <input
                            value={row.itemName}
                            onChange={(e) => updateRow(row.id, "itemName", e.target.value)}
                            placeholder="Item Name"
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={row.currentQuantity}
                              onChange={(e) => updateRow(row.id, "currentQuantity", Number(e.target.value))}
                              className={`w-24 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 ${row.currentQuantity < 0 ? "text-red-500 font-semibold" : ""}`}
                            />
                            <select
                              value={row.unit}
                              onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                              className="border border-gray-200 rounded-md px-1.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            >
                              <option>Kg</option><option>Nos</option><option>L</option><option>m</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => incrementChange(row.id)} className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 flex-shrink-0">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => decrementChange(row.id)} className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 flex-shrink-0">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={row.changeQuantity}
                              onChange={(e) => updateRow(row.id, "changeQuantity", Number(e.target.value))}
                              className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                            <span className="text-xs text-gray-400">{row.unit}</span>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <span className={`font-semibold text-sm ${finalQty < 0 ? "text-red-500" : "text-gray-700"}`}>
                            {finalQty.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={row.defaultPrice}
                            onChange={(e) => updateRow(row.id, "defaultPrice", Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>

                        <td className="px-3 py-2.5">
                          <select
                            value={row.adjustmentType}
                            onChange={(e) => updateRow(row.id, "adjustmentType", e.target.value)}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          >
                            {ADJUSTMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </td>

                        <td className="px-3 py-2.5">
                          <input
                            value={row.comment}
                            onChange={(e) => updateRow(row.id, "comment", e.target.value)}
                            placeholder="Add a comment"
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>

                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700">
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Global Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Add a Comment Here</label>
            <textarea
              value={globalComment}
              onChange={(e) => setGlobalComment(e.target.value)}
              placeholder="Add a comment"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProductStockModal;
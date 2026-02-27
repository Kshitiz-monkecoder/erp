import React, { useRef, useState, useEffect } from "react";
import { X, Download, Upload, Plus, Minus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { get, put } from "@/lib/apiService";

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
  // per-row save state
  saveStatus?: "idle" | "saving" | "success" | "error";
  saveError?: string;
}

export interface InventoryItemOption {
  id: number;
  name: string;
  sku: string;
  currentStock: number;
  defaultPrice: string;
  unit?: { name: string };
}

type Warehouse = {
  id: number;
  name: string;
};

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  items?: InventoryItemOption[];
  onSuccess?: () => void;
}

const ADJUSTMENT_TYPES = [
  "Purchase",
  "Sale",
  "Adjustment",
  "Return",
  "Damage",
  "Production",
  "Other",
];
const TEMPLATE_HEADERS = [
  "Item ID",
  "Item Name",
  "Unit",
  "Change By Qty",
  "Final Qty",
  "Price",
  "Adjustment Type",
  "Comment",
];

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
  saveStatus: "idle",
});

// ─── Download Template ────────────────────────────────────────────────────────

const downloadTemplate = () => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    TEMPLATE_HEADERS,
    ["RM01", "Raw Material 1", "Kg", 0, "", 150, "Production", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "MySheet");
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

const UpdateProductStockModal: React.FC<IProps> = ({
  isOpen,
  onClose,
  items = [],
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [useFIFO, setUseFIFO] = useState(true);
  const [globalComment, setGlobalComment] = useState("");
  const [rows, setRows] = useState<StockRow[]>([emptyRow()]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saveComplete, setSaveComplete] = useState(false);

  // ── Fetch warehouses on open ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchWarehouses = async () => {
      try {
        const res = await get("/inventory/warehouse");
        const list: Warehouse[] = res.data ?? [];
        setWarehouses(list);
        if (list.length > 0) {
          setSelectedWarehouseId(String(list[0].id));
        }
      } catch (e) {
        console.error("Failed to fetch warehouses:", e);
      }
    };
    fetchWarehouses();
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRows([emptyRow()]);
      setGlobalComment("");
      setGlobalError(null);
      setSaveComplete(false);
      setUploadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Row helpers ─────────────────────────────────────────────────────────────

  const updateRow = (
    id: string,
    field: keyof StockRow,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value, saveStatus: "idle" as const, saveError: undefined };
        if (field === "itemId" && typeof value === "string") {
          const match = items.find(
            (i) => String(i.id) === value || i.sku === value
          );
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
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, changeQuantity: r.changeQuantity + 1, saveStatus: "idle" as const }
          : r
      )
    );

  const decrementChange = (id: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, changeQuantity: r.changeQuantity - 1, saveStatus: "idle" as const }
          : r
      )
    );

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
        const json: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        });

        if (json.length < 2) {
          setUploadError("Template is empty or has no data rows.");
          return;
        }

        const headerRow = (json[0] as string[]).map((h) =>
          String(h).toLowerCase().trim()
        );
        const col = (name: string) =>
          headerRow.indexOf(name.toLowerCase());

        const dataRows = json
          .slice(1)
          .filter((r) => r.some((c) => c !== ""));
        if (dataRows.length === 0) {
          setUploadError("No data rows found in the uploaded file.");
          return;
        }

        const parsed: StockRow[] = dataRows.map((r) => {
          const itemId = String(r[col("item id")] ?? "");
          const matchedItem = items.find(
            (i) => i.sku === itemId || String(i.id) === itemId
          );
          return {
            id: generateId(),
            itemId,
            itemName: String(
              r[col("item name")] ?? matchedItem?.name ?? ""
            ),
            unit: String(
              r[col("unit")] ?? matchedItem?.unit?.name ?? "Kg"
            ),
            changeQuantity: Number(r[col("change by qty")] ?? 0),
            currentQuantity: matchedItem?.currentStock ?? 0,
            defaultPrice: Number(
              r[col("price")] ?? matchedItem?.defaultPrice ?? 0
            ),
            adjustmentType: String(
              r[col("adjustment type")] ?? "Other"
            ),
            comment: String(r[col("comment")] ?? ""),
            saveStatus: "idle",
          };
        });

        setRows(parsed);
      } catch {
        setUploadError(
          "Failed to parse file. Please use the downloaded template."
        );
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ── Save (calls PUT /inventory/item/:id for each row) ─────────────────────

  const handleSave = async () => {
    if (!selectedWarehouseId) {
      setGlobalError("Please select a warehouse before saving.");
      return;
    }

    // Validate — every row must have an item selected
    const invalidRows = rows.filter((r) => !r.itemId);
    if (invalidRows.length > 0) {
      setGlobalError(
        `${invalidRows.length} row(s) have no item selected. Please fill in all rows or remove them.`
      );
      return;
    }

    setIsSaving(true);
    setGlobalError(null);
    setSaveComplete(false);

    // Mark all rows as saving
    setRows((prev) =>
      prev.map((r) => ({ ...r, saveStatus: "saving" as const, saveError: undefined }))
    );

    let hasErrors = false;

    // Process each row sequentially to avoid race conditions
    for (const row of rows) {
      const finalQuantity = row.currentQuantity + row.changeQuantity;

      try {
        await put(`/inventory/item/${row.itemId}`, {
          warehouse: selectedWarehouseId,
          currentStock: String(finalQuantity),
          status: "approved",
        });

        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, saveStatus: "success" as const } : r
          )
        );
      } catch (err: any) {
        hasErrors = true;
        const message =
          err?.message || err?.error || "Failed to update stock.";
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, saveStatus: "error" as const, saveError: message }
              : r
          )
        );
      }
    }

    setIsSaving(false);

    if (!hasErrors) {
      setSaveComplete(true);
      onSuccess?.();
      // Auto-close after a short success delay
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setGlobalError(
        "Some items failed to update. Review the errors below and retry."
      );
    }
  };

  // ── Retry failed rows only ────────────────────────────────────────────────

  const handleRetryFailed = async () => {
    const failedRows = rows.filter((r) => r.saveStatus === "error");
    if (failedRows.length === 0) return;

    setGlobalError(null);
    setIsSaving(true);

    setRows((prev) =>
      prev.map((r) =>
        r.saveStatus === "error"
          ? { ...r, saveStatus: "saving" as const, saveError: undefined }
          : r
      )
    );

    let hasErrors = false;

    for (const row of failedRows) {
      const finalQuantity = row.currentQuantity + row.changeQuantity;
      try {
        await put(`/inventory/item/${row.itemId}`, {
          warehouse: selectedWarehouseId,
          currentStock: String(finalQuantity),
          status: "approved",
        });
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, saveStatus: "success" as const } : r
          )
        );
      } catch (err: any) {
        hasErrors = true;
        const message = err?.message || err?.error || "Failed to update stock.";
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, saveStatus: "error" as const, saveError: message }
              : r
          )
        );
      }
    }

    setIsSaving(false);
    if (!hasErrors) {
      setSaveComplete(true);
      onSuccess?.();
      setTimeout(() => onClose(), 1200);
    } else {
      setGlobalError("Some items still failed. Review errors and retry.");
    }
  };

  const failedCount = rows.filter((r) => r.saveStatus === "error").length;
  const successCount = rows.filter((r) => r.saveStatus === "success").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col mx-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Update Product Stock
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Global error */}
          {globalError && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">{globalError}</div>
              {failedCount > 0 && (
                <button
                  onClick={handleRetryFailed}
                  disabled={isSaving}
                  className="text-xs font-semibold underline whitespace-nowrap hover:text-red-900 disabled:opacity-50"
                >
                  Retry {failedCount} failed
                </button>
              )}
            </div>
          )}

          {/* Success banner */}
          {saveComplete && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              All {successCount} item(s) updated successfully!
            </div>
          )}

          {/* Store + FIFO */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                To/From Store <span className="text-red-500">*</span>
              </label>
              {warehouses.length > 0 ? (
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={isSaving}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-48 disabled:opacity-60"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={String(w.id)}>
                      {w.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-400 italic">
                  Loading warehouses...
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useFIFO}
                onChange={(e) => setUseFIFO(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
              Use FIFO Price (Price in Item table will be ignored)
            </label>
          </div>

          {/* Product Stock Details */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Product Stock Details
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Upload Template
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUpload}
              />
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
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-10">
                      No.
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-32">
                      Item ID
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">
                      Item Name
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-44">
                      <div className="flex items-center justify-center gap-1.5">
                        Current Quantity
                        <div className="flex gap-0.5">
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded flex items-center justify-center opacity-40">
                            <Plus className="w-3 h-3" />
                          </span>
                          <span className="w-5 h-5 bg-emerald-600 text-white rounded flex items-center justify-center opacity-40">
                            <Minus className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-44">
                      Change Quantity
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-32">
                      Final Quantity
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-28">
                      Default Price
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">
                      Adjustment Type
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 min-w-36">
                      Comment
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-16">
                      Status
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 w-12">
                      Del
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const finalQty = row.currentQuantity + row.changeQuantity;
                    const isRowSaving = row.saveStatus === "saving";
                    const isRowSuccess = row.saveStatus === "success";
                    const isRowError = row.saveStatus === "error";

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                          isRowSuccess
                            ? "bg-emerald-50/60"
                            : isRowError
                            ? "bg-red-50/60"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center text-gray-500 text-xs">
                          {idx + 1}
                        </td>

                        {/* Item ID */}
                        <td className="px-3 py-2.5">
                          {items.length > 0 ? (
                            <select
                              value={row.itemId}
                              onChange={(e) =>
                                updateRow(row.id, "itemId", e.target.value)
                              }
                              disabled={isSaving}
                              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                            >
                              <option value="">Select</option>
                              {items.map((item) => (
                                <option key={item.id} value={String(item.id)}>
                                  {item.sku}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={row.itemId}
                              onChange={(e) =>
                                updateRow(row.id, "itemId", e.target.value)
                              }
                              placeholder="Item ID"
                              disabled={isSaving}
                              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                            />
                          )}
                        </td>

                        {/* Item Name */}
                        <td className="px-3 py-2.5">
                          <input
                            value={row.itemName}
                            onChange={(e) =>
                              updateRow(row.id, "itemName", e.target.value)
                            }
                            placeholder="Item Name"
                            disabled={isSaving}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          />
                        </td>

                        {/* Current Quantity */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={row.currentQuantity}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "currentQuantity",
                                  Number(e.target.value)
                                )
                              }
                              disabled={isSaving}
                              className={`w-24 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60 ${
                                row.currentQuantity < 0
                                  ? "text-red-500 font-semibold"
                                  : ""
                              }`}
                            />
                            <select
                              value={row.unit}
                              onChange={(e) =>
                                updateRow(row.id, "unit", e.target.value)
                              }
                              disabled={isSaving}
                              className="border border-gray-200 rounded-md px-1.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                            >
                              <option>Kg</option>
                              <option>Nos</option>
                              <option>L</option>
                              <option>m</option>
                            </select>
                          </div>
                        </td>

                        {/* Change Quantity */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => incrementChange(row.id)}
                              disabled={isSaving}
                              className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 flex-shrink-0 disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => decrementChange(row.id)}
                              disabled={isSaving}
                              className="w-6 h-6 bg-emerald-600 text-white rounded flex items-center justify-center hover:bg-emerald-700 flex-shrink-0 disabled:opacity-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={row.changeQuantity}
                              onChange={(e) =>
                                updateRow(
                                  row.id,
                                  "changeQuantity",
                                  Number(e.target.value)
                                )
                              }
                              disabled={isSaving}
                              className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                            />
                            <span className="text-xs text-gray-400">
                              {row.unit}
                            </span>
                          </div>
                        </td>

                        {/* Final Quantity */}
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`font-semibold text-sm ${
                              finalQty < 0
                                ? "text-red-500"
                                : "text-gray-700"
                            }`}
                          >
                            {finalQty.toLocaleString()}
                          </span>
                        </td>

                        {/* Default Price */}
                        <td className="px-3 py-2.5">
                          <input
                            type="number"
                            value={row.defaultPrice}
                            onChange={(e) =>
                              updateRow(
                                row.id,
                                "defaultPrice",
                                Number(e.target.value)
                              )
                            }
                            disabled={isSaving}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          />
                        </td>

                        {/* Adjustment Type */}
                        <td className="px-3 py-2.5">
                          <select
                            value={row.adjustmentType}
                            onChange={(e) =>
                              updateRow(
                                row.id,
                                "adjustmentType",
                                e.target.value
                              )
                            }
                            disabled={isSaving}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          >
                            {ADJUSTMENT_TYPES.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </td>

                        {/* Comment */}
                        <td className="px-3 py-2.5">
                          <input
                            value={row.comment}
                            onChange={(e) =>
                              updateRow(row.id, "comment", e.target.value)
                            }
                            placeholder="Add a comment"
                            disabled={isSaving}
                            className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-60"
                          />
                        </td>

                        {/* Per-row save status */}
                        <td className="px-3 py-2.5 text-center">
                          {isRowSaving && (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-500 mx-auto" />
                          )}
                          {isRowSuccess && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                          )}
                          {isRowError && (
                            <div className="group relative flex justify-center">
                              <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
                              {row.saveError && (
                                <div className="hidden group-hover:block absolute bottom-5 right-0 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 z-10 shadow-lg whitespace-normal">
                                  {row.saveError}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Delete */}
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1 || isSaving}
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

            <button
              onClick={addRow}
              disabled={isSaving}
              className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Global Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Add a Comment Here
            </label>
            <textarea
              value={globalComment}
              onChange={(e) => setGlobalComment(e.target.value)}
              placeholder="Add a comment"
              rows={3}
              disabled={isSaving}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none disabled:opacity-60"
            />
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          {/* Progress summary while saving */}
          {isSaving && (
            <p className="text-sm text-gray-500">
              Updating{" "}
              <span className="font-semibold text-emerald-600">
                {successCount}
              </span>{" "}
              of {rows.length} items...
            </p>
          )}
          {!isSaving && failedCount > 0 && (
            <p className="text-sm text-red-600">
              <span className="font-semibold">{failedCount}</span> item(s)
              failed —{" "}
              <button
                onClick={handleRetryFailed}
                className="underline font-semibold hover:text-red-800"
              >
                retry
              </button>
            </p>
          )}
          {!isSaving && failedCount === 0 && successCount === rows.length && successCount > 0 && (
            <p className="text-sm text-emerald-600 font-medium">
              ✓ All items updated
            </p>
          )}
          {!isSaving && failedCount === 0 && successCount === 0 && (
            <span />
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || saveComplete}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors ml-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateProductStockModal;
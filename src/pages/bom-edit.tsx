// src/pages/production/bom-edit.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Package,
  GitBranch,
  DollarSign,
  ArrowLeft,
  Search,
  Loader2,
  Save,
  Link2,
  MoreHorizontal,
  ExternalLink,
  X,
} from "lucide-react";
import { bomAPI, type BOMUpdateRequest } from "@/services/bomService";
import { routingAPI, type Routing } from "@/services/routingService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { get, post } from "@/lib/apiService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Item {
  id: string;
  name: string;
  sku: string;
  unit?: { name: string; description: string; uom: string; id: number };
  category?: { name: string; id: number; description: string };
  currentStock: string;
  defaultPrice: string;
  hsnCode: string;
  minimumStockLevel: string;
  maximumStockLevel: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface ChildBOMFGRow {
  sku: string;
  name: string;
  itemCategory: string;
  quantity: number;
  unit: string;
  costAlloc: number;
  comment: string;
}

interface ChildBOMRMRow {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  comment: string;
}

interface LinkedChildBOM {
  bomId: number;
  bomNumber: string;
  bomName: string;
  finishedGoods: ChildBOMFGRow[];
  rawMaterials: ChildBOMRMRow[];
}

interface UIRawMaterial {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  comment: string;
  alternateItems: string;
  itemData?: Item;
  /** Linked child BOM for this specific RM row. null = explicitly unlinked. */
  childBOM?: LinkedChildBOM | null;
}

interface UIFinishedGood {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  comment: string;
  alternateItems: string;
  itemData?: Item;
}

interface UIScrapItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  comment: string;
  itemData?: Item;
}

interface UIBOMRouting {
  routingId: number;
  routingName: string;
  routingNumber: string;
  comment: string;
}

interface UIOtherCharge {
  classification: string;
  account: string;
  amount: number;
  comment: string;
}

interface BOMLevelData {
  /**
   * The existing bomItem.id from the API — required for PUT requests.
   * undefined for newly added levels (POST append).
   */
  bomItemId?: number;
  expanded: {
    bomSnapshot: boolean;
    finishedGoods: boolean;
    rawMaterials: boolean;
    routing: boolean;
    scrap: boolean;
    otherCharges: boolean;
  };
  finishedGoods: UIFinishedGood[];
  rawMaterials: UIRawMaterial[];
  routing: UIBOMRouting[];
  scrapItems: UIScrapItem[];
  otherCharges: UIOtherCharge[];
}

interface APIBOMListItem {
  id: number;
  docNumber: string;
  docName: string;
  bomItems: Array<{
    finishedGoods: {
      quantity: number;
      costAlloc: number;
      comment: string;
      item: { sku: string; name: string; id: number };
      unit: { name: string };
    };
    rawMaterials: Array<{
      quantity: number;
      costAlloc: number;
      comment: string;
      item: { sku: string; name: string; id: number };
      unit: { name: string };
    }>;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const warehouseAPI = { getWarehouses: () => get("/inventory/warehouse") };

const defaultOtherCharges = (): UIOtherCharge[] => [
  { classification: "Labour Charges",      account: "Mintage", amount: 0, comment: "" },
  { classification: "Machinery Charges",   account: "Account", amount: 0, comment: "" },
  { classification: "Electricity Charges", account: "Account", amount: 0, comment: "" },
  { classification: "Other Charges",       account: "Account", amount: 0, comment: "" },
];

const defaultExpanded = () => ({
  bomSnapshot: true,
  finishedGoods: true,
  rawMaterials: true,
  routing: true,
  scrap: true,
  otherCharges: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// ItemSelect
// ─────────────────────────────────────────────────────────────────────────────
const ItemSelect: React.FC<{
  value: string;
  onValueChange: (value: string, itemData?: Item) => void;
  items: Item[];
  placeholder?: string;
  disabled?: boolean;
  /** Shown when the item with `value` is not present in `items` (e.g. cross-category item) */
  fallbackName?: string;
  fallbackSku?: string;
}> = ({ value, onValueChange, items, placeholder = "Select item", disabled = false, fallbackName, fallbackSku }) => {
  const [search, setSearch] = useState("");

  // Merge the existing item into the list if it isn't already there (cross-category items)
  const allItems = React.useMemo(() => {
    if (!value || !fallbackName) return items;
    const alreadyPresent = items.some((i) => i.id === value);
    if (alreadyPresent) return items;
    // Inject a synthetic entry so the selected value renders and stays selectable
    const synthetic: Item = {
      id: value,
      name: fallbackName,
      sku: fallbackSku ?? value,
      currentStock: "-",
      defaultPrice: "0",
      hsnCode: "",
      minimumStockLevel: "0",
      maximumStockLevel: "0",
    };
    return [synthetic, ...items];
  }, [items, value, fallbackName, fallbackSku]);

  const filtered = allItems.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase())
  );
  const selected = allItems.find((i) => i.id === value);

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        const item = allItems.find((i) => i.id === val);
        onValueChange(val, item);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <div className="flex flex-col text-left">
              <span className="font-medium text-sm">{selected.name}</span>
              <span className="text-xs text-gray-400">SKU: {selected.sku}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64 z-[100]">
        <div className="sticky top-0 bg-white p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">No items found</div>
        ) : (
          filtered.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-gray-500">
                  SKU: {item.sku}{item.category?.name ? ` | ${item.category.name}` : ""}{item.currentStock !== "-" ? ` | Stock: ${item.currentStock}` : ""}
                </span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RawMaterialActionsMenu
// ─────────────────────────────────────────────────────────────────────────────
const RawMaterialActionsMenu: React.FC<{
  onLinkChildBOM: () => void;
  onRemove: () => void;
  hasChildBOM: boolean;
  hasItem: boolean;
}> = ({ onLinkChildBOM, onRemove, hasChildBOM, hasItem }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.right - 208 });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="Row actions"
        className="h-8 w-8 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-500"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          className="w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
        >
          <button
            onClick={() => { if (!hasItem) return; setOpen(false); onLinkChildBOM(); }}
            disabled={!hasItem}
            title={!hasItem ? "Select an item first" : undefined}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
              hasItem
                ? "hover:bg-blue-50 text-gray-700 cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            <Link2 className={`h-4 w-4 shrink-0 ${hasItem ? "text-blue-600" : "text-gray-300"}`} />
            <span className="flex-1">{hasChildBOM ? "Change Child Link" : "Link Child BOM"}</span>
            {!hasItem && (
              <span className="text-[10px] text-gray-400 shrink-0">Select item first</span>
            )}
            {hasItem && hasChildBOM && (
              <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-medium shrink-0">Linked</span>
            )}
          </button>
          <div className="border-t border-gray-100 my-0.5" />
          <button
            onClick={() => { setOpen(false); onRemove(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 text-left transition-colors"
          >
            <X className="h-4 w-4 shrink-0" />
            <span>Remove Row</span>
          </button>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LinkChildBOMDialog
// ─────────────────────────────────────────────────────────────────────────────
const LinkChildBOMDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSave: (childBOM: LinkedChildBOM) => void;
  currentChildBOM?: LinkedChildBOM | null;
  itemId?: string;
}> = ({ open, onClose, onSave, currentChildBOM, itemId }) => {
  const [bomList, setBomList] = useState<APIBOMListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [noBOMsFound, setNoBOMsFound] = useState(false);
  const [selectedBOMId, setSelectedBOMId] = useState<string>("");
  const [fgRows, setFgRows] = useState<ChildBOMFGRow[]>([]);
  const [rmRows, setRmRows] = useState<ChildBOMRMRow[]>([]);
  const [idSearch, setIdSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedBOMId(currentChildBOM?.bomId?.toString() ?? "");
      setFgRows(currentChildBOM?.finishedGoods ?? []);
      setRmRows(currentChildBOM?.rawMaterials ?? []);
      setIdSearch("");
      setNameSearch("");
      setNoBOMsFound(false);
      fetchBOMList();
    }
  }, [open]);

  const fetchBOMList = async () => {
    setLoadingList(true);
    setNoBOMsFound(false);
    try {
      const url = itemId
        ? `/production/bom/finished-goods-item/${itemId}`
        : `/production/bom?page=1&limit=100&status=published`;
      const res = await get(url);
      if (res?.status && Array.isArray(res.data)) {
        setBomList(res.data as APIBOMListItem[]);
        setNoBOMsFound(res.data.length === 0);
      } else {
        setBomList([]);
        setNoBOMsFound(true);
      }
    } catch { setBomList([]); setNoBOMsFound(true); }
    finally { setLoadingList(false); }
  };

  const handleSelectBOM = async (bomId: string) => {
    setSelectedBOMId(bomId);
    if (!bomId) { setFgRows([]); setRmRows([]); return; }
    const found = bomList.find((b) => b.id.toString() === bomId);
    if (found) {
      populateTablesFromBOM(found);
    } else {
      try {
        const res = await get(`/production/bom/${bomId}`);
        if (res?.status && res.data) populateTablesFromBOM(res.data as APIBOMListItem);
      } catch { setFgRows([]); setRmRows([]); }
    }
  };

  const populateTablesFromBOM = (bom: APIBOMListItem) => {
    setFgRows(
      (bom.bomItems ?? []).map((bi) => ({
        sku: bi.finishedGoods?.item?.sku ?? "-",
        name: bi.finishedGoods?.item?.name ?? "-",
        itemCategory: "-",
        quantity: bi.finishedGoods?.quantity ?? 0,
        unit: bi.finishedGoods?.unit?.name ?? "-",
        costAlloc: bi.finishedGoods?.costAlloc ?? 0,
        comment: bi.finishedGoods?.comment || "-",
      }))
    );
    setRmRows(
      (bom.bomItems ?? []).flatMap((bi) =>
        (bi.rawMaterials ?? []).map((rm) => ({
          sku: rm.item?.sku ?? "-",
          name: rm.item?.name ?? "-",
          category: "-",
          quantity: rm.quantity ?? 0,
          unit: rm.unit?.name ?? "-",
          comment: rm.comment || "-",
        }))
      )
    );
  };

  const filteredRM = rmRows.filter(
    (r) =>
      r.sku.toLowerCase().includes(idSearch.toLowerCase()) &&
      r.name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  const selectedBOM = bomList.find((b) => b.id.toString() === selectedBOMId);

  const handleSave = () => {
    if (!selectedBOMId || !selectedBOM) { alert("Please select a BOM to link"); return; }
    onSave({
      bomId: selectedBOM.id,
      bomNumber: selectedBOM.docNumber,
      bomName: selectedBOM.docName,
      finishedGoods: fgRows,
      rawMaterials: rmRows,
    });
    onClose();
  };

  const TH: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{children}</th>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-white sticky top-0 z-10">
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-800">Link Child BOM</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* FG table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>{["#", "ID", "NAME", "ITEM CATEGORY", "QUANTITY", "UNIT", "COST ALLOCATION (%)", "COMMENT"].map((h) => <TH key={h}>{h}</TH>)}</tr></thead>
              <tbody>
                {fgRows.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No data available</td></tr>
                  : fgRows.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 text-blue-600 font-medium text-xs">{row.sku}</td>
                      <td className="px-4 py-2.5 text-blue-600 text-xs">{row.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{row.itemCategory}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-xs">{row.quantity}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{row.unit}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-xs">{row.costAlloc}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{row.comment}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* RM table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>{["#", "ID", "NAME", "CATEGORY", "QUANTITY", "UNIT", "COMMENT"].map((h) => <TH key={h}>{h}</TH>)}</tr></thead>
              <tbody>
                <tr className="border-t bg-white">
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"><Input placeholder="Search..." value={idSearch} onChange={(e) => setIdSearch(e.target.value)} className="h-7 text-xs border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 shadow-none" /></td>
                  <td className="px-4 py-2"><Input placeholder="Search..." value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} className="h-7 text-xs border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 shadow-none" /></td>
                  <td colSpan={4} className="px-4 py-2"></td>
                </tr>
                {filteredRM.length === 0
                  ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No data available</td></tr>
                  : filteredRM.map((row, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 text-blue-600 font-medium text-xs">{row.sku}</td>
                      <td className="px-4 py-2.5 text-blue-600 text-xs">{row.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{row.category}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-xs">{row.quantity}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{row.unit}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{row.comment}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* BOM selector */}
          <div className="flex items-center justify-end gap-2">
            <div className="min-w-[260px] relative">
              <Select value={selectedBOMId} onValueChange={handleSelectBOM}>
                <SelectTrigger className="h-10 border border-gray-300 rounded-lg">
                  {loadingList
                    ? <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading BOMs…</div>
                    : <SelectValue placeholder="Select BOM">{selectedBOM ? selectedBOM.docNumber : "Select BOM"}</SelectValue>}
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {loadingList
                    ? <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-blue-500" /></div>
                    : noBOMsFound
                    ? <div className="py-4 px-3 text-center space-y-2">
                        <p className="text-gray-500 text-sm">No BOMs found for this item</p>
                        <button
                          className="text-sm font-medium text-[#105076] hover:underline"
                          onMouseDown={(e) => { e.preventDefault(); window.open("/production/bom/create", "_blank"); }}
                        >
                          + Create BOM
                        </button>
                      </div>
                    : bomList.map((bom) => <SelectItem key={bom.id} value={bom.id.toString()}>{bom.docNumber}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedBOMId && <span className="absolute -top-2.5 left-3 text-[10px] text-gray-500 bg-white px-1">Select BOM</span>}
            </div>
            {selectedBOMId && (
              <button onClick={() => { setSelectedBOMId(""); setFgRows([]); setRmRows([]); }} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600" title="Clear selection"><X className="h-4 w-4" /></button>
            )}
            {selectedBOMId && (
              <button onClick={() => window.open(`/production/bom/${selectedBOMId}`, "_blank")} className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600" title="Open BOM"><ExternalLink className="h-4 w-4" /></button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 sticky bottom-0">
          <Button variant="outline" onClick={() => window.open("/production/bom/create", "_blank")} className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <ExternalLink className="h-4 w-4" /> Create BOM
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!selectedBOMId} className="bg-[#105076] hover:bg-[#0d4566] text-white font-semibold px-8 uppercase tracking-wide">Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RoutingDialog
// ─────────────────────────────────────────────────────────────────────────────
const RoutingDialog: React.FC<{
  onSelect: (routing: Routing, comment: string) => void;
  levelIndex: number;
}> = ({ onSelect, levelIndex }) => {
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
      else setError("Invalid routing data format");
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

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && !hasFetched) fetchRoutings(); }}>
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
                <Button onClick={handleCreate} disabled={creating} className="flex-1">{creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Create Routing</Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => { setShowNewForm(true); setSelectedRouting(null); }} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" /> Create New Routing</Button>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Existing Routings</h3>
              <Button variant="ghost" size="sm" onClick={fetchRoutings} disabled={loading} className="h-8 w-8 p-0"><Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
            </div>
            {loading ? <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
              : error ? <div className="p-8 text-center text-red-600">{error}</div>
              : routings.length === 0 ? <div className="p-8 text-center text-gray-500">No routings found</div>
              : (
                <div className="max-h-64 overflow-y-auto divide-y">
                  {routings.map((r) => (
                    <div key={r.id} onClick={() => { setSelectedRouting(r); setShowNewForm(false); }} className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center gap-3 ${selectedRouting?.id === r.id ? "bg-blue-50" : ""}`}>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedRouting?.id === r.id ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                        {selectedRouting?.id === r.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div><p className="font-semibold text-sm">{r.number}</p><p className="text-xs text-gray-600">{r.name}</p></div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {selectedRouting && (
            <div><Label>Comment for "{selectedRouting.number}"</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="mt-1" /></div>
          )}

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
// BOMLevel
// ─────────────────────────────────────────────────────────────────────────────
const BOMLevel: React.FC<{
  levelIndex: number;
  data: BOMLevelData;
  fgItems: Item[];
  rmItems: Item[];
  scrapItems2: Item[];
  onUpdate: (updated: BOMLevelData) => void;
  onDelete?: () => void;
  childBOMExpandedSet: Set<number>;
  onOpenChildBOM: (idx: number) => void;
  onToggleChildBOMExpanded: (idx: number) => void;
  onUnlinkChildBOM: (idx: number) => void;
}> = ({
  levelIndex, data, fgItems, rmItems, scrapItems2, onUpdate, onDelete,
  childBOMExpandedSet,
  onOpenChildBOM, onToggleChildBOMExpanded, onUnlinkChildBOM,
}) => {
  const toggle = (s: keyof BOMLevelData["expanded"]) =>
    onUpdate({ ...data, expanded: { ...data.expanded, [s]: !data.expanded[s] } });

  const addFG = () => onUpdate({ ...data, finishedGoods: [...data.finishedGoods, { itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }] });
  const removeFG = (i: number) => { if (data.finishedGoods.length > 1) onUpdate({ ...data, finishedGoods: data.finishedGoods.filter((_, j) => j !== i) }); };
  const updateFG = (i: number, field: keyof UIFinishedGood, val: any, itemData?: Item) => {
    const arr = [...data.finishedGoods];
    if (field === "itemId" && itemData) arr[i] = { ...arr[i], itemId: val, name: itemData.name, category: itemData.category?.name ?? "", unit: itemData.unit?.name ?? "", itemData };
    else arr[i] = { ...arr[i], [field]: val };
    onUpdate({ ...data, finishedGoods: arr });
  };

  const addRM = () => onUpdate({ ...data, rawMaterials: [...data.rawMaterials, { itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" }] });
  const removeRM = (i: number) => onUpdate({ ...data, rawMaterials: data.rawMaterials.filter((_, j) => j !== i) });
  const updateRM = (i: number, field: keyof UIRawMaterial, val: any, itemData?: Item) => {
    const arr = [...data.rawMaterials];
    if (field === "itemId" && itemData) arr[i] = { ...arr[i], itemId: val, name: itemData.name, category: itemData.category?.name ?? "", unit: itemData.unit?.name ?? "", itemData };
    else arr[i] = { ...arr[i], [field]: val };
    onUpdate({ ...data, rawMaterials: arr });
  };

  const addRouting = (routing: Routing, comment: string) =>
    onUpdate({ ...data, routing: [...data.routing, { routingId: routing.id, routingName: routing.name, routingNumber: routing.number, comment }] });
  const removeRouting = (i: number) => onUpdate({ ...data, routing: data.routing.filter((_, j) => j !== i) });

  const addScrap = () => onUpdate({ ...data, scrapItems: [...data.scrapItems, { id: "", name: "", category: "", quantity: 0, unit: "", costAllocation: 0, comment: "" }] });
  const removeScrap = (i: number) => onUpdate({ ...data, scrapItems: data.scrapItems.filter((_, j) => j !== i) });
  const updateScrap = (i: number, field: keyof UIScrapItem, val: any, itemData?: Item) => {
    const arr = [...data.scrapItems];
    if (field === "id" && itemData) arr[i] = { ...arr[i], id: val, name: itemData.name, category: itemData.category?.name ?? "", unit: itemData.unit?.name ?? "", itemData };
    else arr[i] = { ...arr[i], [field]: val };
    onUpdate({ ...data, scrapItems: arr });
  };

  const updateCharge = (i: number, field: keyof UIOtherCharge, val: any) => {
    const arr = [...data.otherCharges];
    arr[i] = { ...arr[i], [field]: val };
    onUpdate({ ...data, otherCharges: arr });
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl bg-white mt-8 first:mt-0 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-[#105076] text-white rounded-t-xl">
        <h2 className="text-xl font-bold">BOM Level {levelIndex + 1}</h2>
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} className="hover:bg-white/20">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* BOM Summary */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggle("bomSnapshot")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><FileText className="h-5 w-5" /> BOM Summary</h3>
        {data.expanded.bomSnapshot ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.bomSnapshot && (
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "RAW MATERIALS",  count: data.rawMaterials.filter((r) => r.itemId).length,  color: "blue"   },
              { label: "ROUTING",        count: data.routing.length,                               color: "green"  },
              { label: "FINISHED GOODS", count: data.finishedGoods.filter((f) => f.itemId).length, color: "purple" },
              { label: "SCRAP",          count: data.scrapItems.filter((s) => s.id).length,        color: "orange" },
            ].map(({ label, count, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4 text-center`}>
                <p className={`text-3xl font-bold text-${color}-600`}>{count}</p>
                <p className={`text-xs font-semibold text-${color}-700 mt-1`}>{label}</p>
                <p className={`text-xs text-${color}-500 mt-0.5`}>{count > 0 ? `${count} item(s)` : "None added"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finished Goods */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggle("finishedGoods")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><Package className="h-5 w-5 text-green-600" /> Finished Goods</h3>
        {data.expanded.finishedGoods ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.finishedGoods && (
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Finished Goods List</span>
            <Button size="sm" onClick={addFG} className="h-8"><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
          </div>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {["#", "Item", "Category", "Qty", "Unit", "Cost %", "Comment", "Alternate", ""].map((h, i) => (
                    <th key={i} className={`px-3 py-2.5 text-left text-xs font-medium text-gray-600 ${i === 1 ? "min-w-[200px]" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.finishedGoods.map((fg, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400 text-xs w-8">{i + 1}</td>
                    <td className="px-3 py-2 min-w-[200px]"><ItemSelect value={fg.itemId} onValueChange={(v, d) => updateFG(i, "itemId", v, d)} items={fgItems} placeholder="Select FG item" fallbackName={fg.name} fallbackSku={fg.itemData?.sku} /></td>
                    <td className="px-3 py-2"><Input value={fg.category} onChange={(e) => updateFG(i, "category", e.target.value)} className="h-8 text-xs w-28" readOnly={!!fg.itemData} /></td>
                    <td className="px-3 py-2"><Input type="number" value={fg.quantity} onChange={(e) => updateFG(i, "quantity", Number(e.target.value) || 0)} className="h-8 text-xs w-20" min="1" /></td>
                    <td className="px-3 py-2"><Input value={fg.unit} onChange={(e) => updateFG(i, "unit", e.target.value)} className="h-8 text-xs w-20" readOnly={!!fg.itemData} /></td>
                    <td className="px-3 py-2"><Input type="number" value={fg.costAllocation} onChange={(e) => updateFG(i, "costAllocation", Number(e.target.value) || 0)} className="h-8 text-xs w-20" min="0" max="100" /></td>
                    <td className="px-3 py-2"><Input value={fg.comment} onChange={(e) => updateFG(i, "comment", e.target.value)} className="h-8 text-xs w-28" /></td>
                    <td className="px-3 py-2"><Input value={fg.alternateItems} onChange={(e) => updateFG(i, "alternateItems", e.target.value)} className="h-8 text-xs w-28" /></td>
                    <td className="px-3 py-2">
                      {data.finishedGoods.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeFG(i)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Materials */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggle("rawMaterials")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><Package className="h-5 w-5 text-blue-600" /> Raw Materials</h3>
        {data.expanded.rawMaterials ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.rawMaterials && (
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Raw Materials Required</span>
            <Button size="sm" onClick={addRM} className="h-8"><Plus className="h-3.5 w-3.5 mr-1" /> Add Raw Material Row</Button>
          </div>
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 w-10">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 min-w-[200px]">Item</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Category</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Qty</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Unit</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Comment</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Alternate</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rawMaterials.map((rm, i) => {
                  const childExpanded = childBOMExpandedSet.has(i);
                  return (
                    <React.Fragment key={i}>
                      <tr className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 w-10">
                          {rm.childBOM ? (
                            <button onClick={() => onToggleChildBOMExpanded(i)} className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#105076] text-white shrink-0">
                                {childExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{i + 1}</span>
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-gray-600">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 min-w-[200px]"><ItemSelect value={rm.itemId} onValueChange={(v, d) => updateRM(i, "itemId", v, d)} items={rmItems} placeholder="Select RM item" fallbackName={rm.name} fallbackSku={rm.itemData?.sku} /></td>
                        <td className="px-3 py-2"><Input value={rm.category} onChange={(e) => updateRM(i, "category", e.target.value)} className="h-8 text-xs w-28" readOnly={!!rm.itemData} /></td>
                        <td className="px-3 py-2"><Input type="number" value={rm.quantity} onChange={(e) => updateRM(i, "quantity", Number(e.target.value) || 0)} className="h-8 text-xs w-20" min="1" /></td>
                        <td className="px-3 py-2"><Input value={rm.unit} onChange={(e) => updateRM(i, "unit", e.target.value)} className="h-8 text-xs w-20" readOnly={!!rm.itemData} /></td>
                        <td className="px-3 py-2"><Input value={rm.comment} onChange={(e) => updateRM(i, "comment", e.target.value)} className="h-8 text-xs w-28" /></td>
                        <td className="px-3 py-2"><Input value={rm.alternateItems} onChange={(e) => updateRM(i, "alternateItems", e.target.value)} className="h-8 text-xs w-28" /></td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button title="Details" className="h-8 w-8 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-400">
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            </button>
                            <RawMaterialActionsMenu
                              onLinkChildBOM={() => onOpenChildBOM(i)}
                              onRemove={() => removeRM(i)}
                              hasChildBOM={!!rm.childBOM}
                              hasItem={!!rm.itemId}
                            />
                          </div>
                        </td>
                      </tr>

                      {rm.childBOM && childExpanded && (
                        <tr className="border-t bg-blue-50">
                          <td colSpan={8} className="px-4 py-1.5">
                            <div className="flex items-center gap-2">
                              <Link2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span className="text-xs font-semibold text-blue-700">Child BOM:</span>
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">{rm.childBOM.bomNumber}</span>
                              <span className="text-xs text-blue-600">{rm.childBOM.bomName}</span>
                              <button onClick={() => onUnlinkChildBOM(i)} className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50">
                                <X className="h-3 w-3" /> Unlink
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {rm.childBOM && childExpanded && rm.childBOM.rawMaterials.map((subRM, j) => (
                        <tr key={`${i}-c-${j}`} className="border-t bg-[#f0f7ff] hover:bg-blue-50/80">
                          <td className="px-3 py-2 w-10">
                            <div className="flex items-center justify-center">
                              <span className="text-xs font-semibold text-white px-1.5 py-0.5 rounded min-w-[28px] text-center" style={{ backgroundColor: "#e8936a" }}>
                                {i + 1}.{j + 1}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 min-w-[200px]">
                            <div className="h-8 flex items-center border border-gray-200 rounded px-3 bg-gray-50 text-xs font-medium text-gray-700 w-full">{subRM.sku || "—"}</div>
                          </td>
                          <td className="px-3 py-2"><div className="h-8 flex items-center border border-gray-200 rounded px-3 bg-gray-50 text-xs text-gray-700 w-28 truncate">{subRM.name || "—"}</div></td>
                          <td className="px-3 py-2"><Input value={subRM.category || ""} readOnly className="h-8 text-xs w-20 bg-gray-50" /></td>
                          <td className="px-3 py-2"><Input value={subRM.quantity} readOnly className="h-8 text-xs w-20 bg-gray-50 text-right" /></td>
                          <td className="px-3 py-2"><Input value={subRM.unit || ""} readOnly className="h-8 text-xs w-20 bg-gray-50" /></td>
                          <td className="px-3 py-2"><Input value={subRM.comment || ""} readOnly className="h-8 text-xs w-28 bg-gray-50" /></td>
                          <td className="px-3 py-2"><div className="h-8 w-8" /></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Routing */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggle("routing")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><GitBranch className="h-5 w-5 text-purple-600" /> Routing</h3>
        {data.expanded.routing ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.routing && (
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="mb-4"><RoutingDialog onSelect={(r, c) => addRouting(r, c)} levelIndex={levelIndex} /></div>
          {data.routing.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="grid grid-cols-5 text-xs font-medium text-gray-600 bg-gray-100 border-b">
                {["#", "Routing Number", "Name", "Comment", ""].map((h) => <div key={h} className="px-3 py-2.5">{h}</div>)}
              </div>
              {data.routing.map((r, i) => (
                <div key={i} className="grid grid-cols-5 border-b hover:bg-gray-50">
                  <div className="px-3 py-2.5 text-gray-400 text-xs flex items-center">{i + 1}</div>
                  <div className="px-3 py-2.5 font-medium text-sm flex items-center">{r.routingNumber}</div>
                  <div className="px-3 py-2.5 text-gray-600 text-sm flex items-center">{r.routingName}</div>
                  <div className="px-3 py-2.5 flex items-center">
                    <Input value={r.comment} onChange={(e) => { const u = [...data.routing]; u[i] = { ...u[i], comment: e.target.value }; onUpdate({ ...data, routing: u }); }} className="h-8 text-xs" placeholder="Add comment" />
                  </div>
                  <div className="px-3 py-2.5 flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => removeRouting(i)} className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrap */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggle("scrap")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><Trash2 className="h-5 w-5 text-orange-500" /> Scrap / By-Products</h3>
        {data.expanded.scrap ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.scrap && (
        <div className="px-6 py-5 border-b bg-gray-50">
          <div className="bg-white rounded-lg border overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead style={{ backgroundColor: "#105076" }}>
                <tr>{["#", "Item", "Name", "Category", "Quantity", "Unit", "Cost Alloc (%)", "Comment", "Actions"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-white">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {data.scrapItems.length === 0
                  ? <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">No data available</td></tr>
                  : data.scrapItems.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 min-w-[180px]"><ItemSelect value={s.id} onValueChange={(v, d) => updateScrap(i, "id", v, d)} items={scrapItems2} placeholder="Select Scrap item" fallbackName={s.name} fallbackSku={s.itemData?.sku} /></td>
                      <td className="px-4 py-2"><Input value={s.name} onChange={(e) => updateScrap(i, "name", e.target.value)} className="h-8 text-xs w-24" readOnly={!!s.itemData} /></td>
                      <td className="px-4 py-2"><Input value={s.category} onChange={(e) => updateScrap(i, "category", e.target.value)} className="h-8 text-xs w-24" readOnly={!!s.itemData} /></td>
                      <td className="px-4 py-2"><Input type="number" value={s.quantity} onChange={(e) => updateScrap(i, "quantity", Number(e.target.value) || 0)} className="h-8 text-xs w-20" min="0" /></td>
                      <td className="px-4 py-2"><Input value={s.unit} onChange={(e) => updateScrap(i, "unit", e.target.value)} className="h-8 text-xs w-20" readOnly={!!s.itemData} /></td>
                      <td className="px-4 py-2"><Input type="number" value={s.costAllocation} onChange={(e) => updateScrap(i, "costAllocation", Number(e.target.value) || 0)} className="h-8 text-xs w-20" min="0" max="100" /></td>
                      <td className="px-4 py-2"><Input value={s.comment} onChange={(e) => updateScrap(i, "comment", e.target.value)} className="h-8 text-xs w-28" /></td>
                      <td className="px-4 py-2"><Button variant="ghost" size="icon" onClick={() => removeScrap(i)} className="h-7 w-7 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3"><Button onClick={addScrap} size="sm" className="bg-[#105076] hover:bg-[#0d4566]"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Scrap Row</Button></div>
        </div>
      )}

      {/* Other Charges */}
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle("otherCharges")}>
        <h3 className="font-semibold flex items-center gap-2 text-[#105076]"><DollarSign className="h-5 w-5 text-teal-600" /> Other Charges</h3>
        {data.expanded.otherCharges ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </div>
      {data.expanded.otherCharges && (
        <div className="px-6 py-5">
          <div className="space-y-2">
            {data.otherCharges.map((c, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg items-center">
                <span className="text-sm font-medium text-gray-700">{c.classification}</span>
                <span className="text-xs text-gray-500">{c.account}</span>
                <Input type="number" value={c.amount} onChange={(e) => updateCharge(i, "amount", Number(e.target.value) || 0)} className="h-9 text-sm" placeholder="Amount" min="0" />
                <Input value={c.comment} onChange={(e) => updateCharge(i, "comment", e.target.value)} placeholder="Note…" className="h-9 text-sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EditBOM — main page
// ─────────────────────────────────────────────────────────────────────────────
const EditBOM: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [docName, setDocName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [status, setStatus] = useState<"planned" | "published" | "wip" | "completed">("planned");
  const [fgStore, setFgStore] = useState("");
  const [rmStore, setRmStore] = useState("");
  const [scrapStore, setScrapStore] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fgItems, setFgItems] = useState<Item[]>([]);
  const [rmItems, setRmItems] = useState<Item[]>([]);
  const [scrapItems2, setScrapItems2] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  const [levels, setLevels] = useState<BOMLevelData[]>([]);

  // Child BOM dialog state — per level + per RM index
  const [childBOMDialogOpen, setChildBOMDialogOpen] = useState(false);
  const [childBOMTargetIdx, setChildBOMTargetIdx] = useState<number | null>(null);
  const [childBOMTargetLevel, setChildBOMTargetLevel] = useState<number>(0);
  const [childBOMExpandedSet, setChildBOMExpandedSet] = useState<Set<number>>(new Set());

  // Encode (levelIdx, rmIdx) → single key for the Set
  const encodeKey = (levelIdx: number, rmIdx: number) => levelIdx * 10000 + rmIdx;

  const openChildBOM = (levelIdx: number, rmIdx: number) => {
    setChildBOMTargetLevel(levelIdx);
    setChildBOMTargetIdx(rmIdx);
    setChildBOMDialogOpen(true);
  };

  const toggleChildBOMExpanded = (levelIdx: number, rmIdx: number) => {
    const key = encodeKey(levelIdx, rmIdx);
    setChildBOMExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const unlinkChildBOM = (levelIdx: number, rmIdx: number) => {
    setLevels((prev) => prev.map((lvl, i) => {
      if (i !== levelIdx) return lvl;
      const rms = [...lvl.rawMaterials];
      rms[rmIdx] = { ...rms[rmIdx], childBOM: null };
      return { ...lvl, rawMaterials: rms };
    }));
    setChildBOMExpandedSet((prev) => { const next = new Set(prev); next.delete(encodeKey(levelIdx, rmIdx)); return next; });
  };

  const handleChildBOMSave = (childBOM: LinkedChildBOM) => {
    if (childBOMTargetIdx === null) return;
    const lIdx = childBOMTargetLevel;
    const rIdx = childBOMTargetIdx;
    setLevels((prev) => prev.map((lvl, i) => {
      if (i !== lIdx) return lvl;
      const rms = [...lvl.rawMaterials];
      rms[rIdx] = { ...rms[rIdx], childBOM };
      return { ...lvl, rawMaterials: rms };
    }));
    setChildBOMExpandedSet((prev) => new Set(prev).add(encodeKey(lIdx, rIdx)));
    setChildBOMTargetIdx(null);
  };

  // ── Fetch items by category ──
  const fetchItemsByCategory = async (category: string): Promise<Item[]> => {
    try {
      const res = await post("/inventory/items", {
        filters: {},
        search: { item_category: { value: category } },
        pagination: { page: 1, itemsPerPage: 500, sortBy: ["createdAt"], sortDesc: [true] },
      });
      if (res?.status && Array.isArray(res.data?.items ?? res.data)) {
        const raw = res.data?.items ?? res.data;
        return raw.map((item: any) => ({
          id: item.id?.toString() ?? "",
          name: item.name ?? "",
          sku: item.sku ?? "",
          unit: item.unit,
          category: item.category,
          currentStock: item.currentStock ?? "0",
          defaultPrice: item.defaultPrice ?? "0",
          hsnCode: item.hsnCode ?? "",
          minimumStockLevel: item.minimumStockLevel ?? "0",
          maximumStockLevel: item.maximumStockLevel ?? "0",
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingItems(true);
      try {
        const [fg, rm, scrap] = await Promise.all([
          fetchItemsByCategory("FG"),
          fetchItemsByCategory("RM"),
          fetchItemsByCategory("Scrap"),
        ]);
        setFgItems(fg);
        setRmItems(rm);
        setScrapItems2(scrap);
      } finally {
        setLoadingItems(false);
      }
    })();
  }, []);

  // ── Fetch warehouses ──
  useEffect(() => {
    (async () => {
      setLoadingWarehouses(true);
      try {
        const res = await warehouseAPI.getWarehouses();
        if (res?.status && Array.isArray(res.data)) setWarehouses(res.data);
      } catch { setWarehouses([]); }
      finally { setLoadingWarehouses(false); }
    })();
  }, []);

  // ── Fetch BOM for editing ──
  useEffect(() => {
    if (!id || loadingItems) return;

    (async () => {
      setLoading(true);
      try {
        const res = await bomAPI.getBOM(parseInt(id));
        if (!res?.status || !res.data) { toast.error("Failed to load BOM"); return; }
        const d = res.data;

        setDocNumber(d.docNumber ?? "");
        setDocName(d.docName ?? "");
        setDocDate(d.docDate ? d.docDate.split("T")[0] : "");
        setDescription(d.docDescription ?? "");
        setComments(d.docComment ?? "");
        const s = d.status?.toLowerCase() as "planned" | "published" | "wip" | "completed";
        setStatus((["planned","published","wip","completed"].includes(s) ? s : "planned") as "planned" | "published" | "wip" | "completed");
        setFgStore(d.fgStore?.id?.toString() ?? "");
        setRmStore(d.rmStore?.id?.toString() ?? "");
        setScrapStore(d.scrapStore?.id?.toString() ?? "");
        if (d.docDescription) setShowDescription(true);
        if (d.docComment) setShowComments(true);

        if (d.bomItems && d.bomItems.length > 0) {
          const expandedSet = new Set<number>();

          const transformed: BOMLevelData[] = d.bomItems.map((bomItem: any, levelIdx: number) => {
            const fgItem = fgItems.find((i) => i.id === bomItem.finishedGoods?.item?.id?.toString());

            // ── Raw Materials — subBom is now per RM row in the API response ──
            const rawMaterials: UIRawMaterial[] = (bomItem.rawMaterials ?? []).map((rm: any, rmIdx: number) => {
              const rmItem = rmItems.find((i) => i.id === rm.item?.id?.toString());

              // subBom nested directly on this RM row (new API structure)
              let childBOM: LinkedChildBOM | null = null;
              const subBomData = rm.subBom ?? null;
              if (subBomData) {
                const childFGs: ChildBOMFGRow[] = (subBomData.bomItems ?? []).map((bi: any) => ({
                  sku: bi.finishedGoods?.item?.sku ?? "-",
                  name: bi.finishedGoods?.item?.name ?? "-",
                  itemCategory: bi.finishedGoods?.item?.type ?? "-",
                  quantity: bi.finishedGoods?.quantity ?? 0,
                  unit: bi.finishedGoods?.unit?.name ?? "-",
                  costAlloc: bi.finishedGoods?.costAlloc ?? 0,
                  comment: bi.finishedGoods?.comment ?? "-",
                }));
                const childRMs: ChildBOMRMRow[] = (subBomData.bomItems ?? []).flatMap((bi: any) =>
                  (bi.rawMaterials ?? []).map((crm: any) => ({
                    sku: crm.item?.sku ?? "-",
                    name: crm.item?.name ?? "-",
                    category: crm.item?.type ?? "-",
                    quantity: crm.quantity ?? 0,
                    unit: crm.unit?.name ?? "-",
                    comment: crm.comment ?? "-",
                  }))
                );
                childBOM = {
                  bomId: subBomData.id,
                  bomNumber: subBomData.docNumber,
                  bomName: subBomData.docName,
                  finishedGoods: childFGs,
                  rawMaterials: childRMs,
                };
                // Auto-expand linked child BOMs on load
                expandedSet.add(encodeKey(levelIdx, rmIdx));
              }

              return {
                itemId: rm.item?.id?.toString() ?? "",
                name: rm.item?.name ?? "",
                category: rm.item?.type ?? "",
                quantity: rm.quantity ?? 1,
                unit: rm.unit?.name ?? "",
                comment: rm.comment ?? "",
                alternateItems: "",
                itemData: rmItem,
                childBOM,
              };
            });

            return {
              // ✅ Track the bomItem.id for use in PUT payload
              bomItemId: bomItem.id,
              expanded: defaultExpanded(),
              finishedGoods: bomItem.finishedGoods
                ? [{
                    itemId: bomItem.finishedGoods.item?.id?.toString() ?? "",
                    name: bomItem.finishedGoods.item?.name ?? "",
                    category: bomItem.finishedGoods.item?.type ?? "",
                    quantity: bomItem.finishedGoods.quantity ?? 1,
                    unit: bomItem.finishedGoods.unit?.name ?? "",
                    costAllocation: bomItem.finishedGoods.costAlloc ?? 0,
                    comment: bomItem.finishedGoods.comment ?? "",
                    alternateItems: "",
                    itemData: fgItem,
                  }]
                : [{ itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }],
              rawMaterials,
              routing: (bomItem.routing ?? []).map((r: any) => ({
                routingId: r.routing?.id ?? 0,
                routingName: r.routing?.name ?? "",
                routingNumber: r.routing?.number ?? "",
                comment: r.comment ?? "",
              })),
              scrapItems: (bomItem.scrap ?? []).map((s: any) => {
                const scrapItem = scrapItems2.find((i) => i.id === s.item?.id?.toString());
                return {
                  id: s.item?.id?.toString() ?? "",
                  name: s.item?.name ?? "",
                  category: s.item?.type ?? "",
                  quantity: s.quantity ?? 0,
                  unit: s.unit?.name ?? "",
                  costAllocation: s.costAlloc ?? 0,
                  comment: s.comment ?? "",
                  itemData: scrapItem,
                };
              }),
              otherCharges: bomItem.otherCharges?.length
                ? bomItem.otherCharges.map((c: any) => ({
                    classification: c.classification ?? "",
                    account: "Account",
                    amount: c.charges ?? 0,
                    comment: c.comment ?? "",
                  }))
                : defaultOtherCharges(),
            };
          });

          setLevels(transformed);
          setChildBOMExpandedSet(expandedSet);
        } else {
          setLevels([{
            expanded: defaultExpanded(),
            finishedGoods: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }],
            rawMaterials: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" }],
            routing: [], scrapItems: [], otherCharges: defaultOtherCharges(),
          }]);
        }
      } catch (e) { console.error(e); toast.error("Failed to load BOM data"); }
      finally { setLoading(false); }
    })();
  }, [id, loadingItems]);

  const addNewLevel = () =>
    setLevels((p) => [...p, {
      // No bomItemId — this is a new level, API will create it
      expanded: defaultExpanded(),
      finishedGoods: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }],
      rawMaterials: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" }],
      routing: [], scrapItems: [], otherCharges: defaultOtherCharges(),
    }]);

  const deleteLevel = (idx: number) => {
    if (levels.length === 1) { toast.error("Cannot delete the last BOM level"); return; }
    setLevels((p) => p.filter((_, i) => i !== idx));
  };

  const updateLevel = (idx: number, d: BOMLevelData) =>
    setLevels((p) => p.map((lvl, i) => i === idx ? d : lvl));

  // ── Build update payload ──
  // - bomItem.id included for existing rows (required by API)
  // - subBomId placed on each individual RM row
  const prepareUpdateData = (targetStatus: "planned" | "published" | "wip" | "completed"): BOMUpdateRequest => ({
    docNumber,
    docDate: docDate || new Date().toISOString().split("T")[0],
    docName,
    docDescription: description || undefined,
    docComment: comments || undefined,
    status: targetStatus,
    fgStoreId: parseInt(fgStore) || 0,
    rmStoreId: parseInt(rmStore) || 0,
    scrapStoreId: parseInt(scrapStore) || 0,
    bomItems: levels.map((level) => {
      const fg = level.finishedGoods[0];
      const fgItem = fgItems.find((i) => i.id === fg.itemId);

      return {
        // ✅ Include bomItem.id for existing rows so the API updates rather than re-inserts
        ...(level.bomItemId !== undefined ? { id: level.bomItemId } : {}),
        finishedGoods: {
          itemId: parseInt(fg.itemId) || 0,
          unitId: fgItem?.unit?.id ?? fg.itemData?.unit?.id ?? 0,
          quantity: fg.quantity,
          costAlloc: fg.costAllocation,
          comment: fg.comment || undefined,
          hasAlternate: !!fg.alternateItems,
        },
        // ✅ Each RM row carries its own subBomId
        rawMaterials: level.rawMaterials.map((rm) => ({
          itemId: parseInt(rm.itemId) || 0,
          unitId: rm.itemData?.unit?.id ?? 0,
          quantity: rm.quantity,
          costAlloc: 0,
          comment: rm.comment || undefined,
          hasAlternate: !!rm.alternateItems,
          // null = explicitly unlink; undefined = no child BOM on this row
          subBomId: rm.childBOM === null ? null : (rm.childBOM?.bomId ?? undefined),
        })),
        routing: level.routing.map((r) => ({ routingId: r.routingId, comment: r.comment || undefined })),
        scrap: level.scrapItems.filter((s) => s.id).map((s) => ({
          itemId: parseInt(s.id) || 0,
          unitId: s.itemData?.unit?.id ?? 0,
          quantity: s.quantity,
          costAlloc: s.costAllocation,
          comment: s.comment || undefined,
        })),
        otherCharges: level.otherCharges.map((c) => ({
          charges: c.amount,
          classification: c.classification,
          comment: c.comment || undefined,
        })),
      };
    }),
  });

  const handleSavePlanned = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await bomAPI.updateBOM(parseInt(id), prepareUpdateData("planned"));
      if (res?.status) { toast.success("BOM saved as planned!"); navigate(`/production/bom/${id}`); }
      else toast.error(res?.message || "Failed to save");
    } catch { toast.error("Error saving BOM"); }
    finally { setSaving(false); }
  };

  const handleSaveBOM = async () => {
    if (!id) return;
    if (!docName.trim()) { toast.error("Please enter a BOM name"); return; }
    try {
      setSaving(true);
      const res = await bomAPI.updateBOM(parseInt(id), prepareUpdateData("published"));
      if (res?.status) { toast.success("BOM updated successfully!"); navigate(`/production/bom/${id}`); }
      else toast.error(res?.message || "Failed to update BOM");
    } catch { toast.error("Error updating BOM"); }
    finally { setSaving(false); }
  };

  const WarehouseSelect: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11">
        <SelectValue placeholder={placeholder}>{warehouses.find((w) => w.id.toString() === value)?.name ?? placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent className="z-[100]">
        {loadingWarehouses
          ? <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
          : warehouses.map((w) => <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" /><p className="mt-4 text-gray-600">Loading BOM…</p></div>
    </div>
  );

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/production/bom/${id}`)} className="h-9 w-9"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-bold text-[#105076]">Edit Bill of Material</h1>
        </div>
        <div className="ml-12">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded font-mono">Doc # {docNumber}</span>
        </div>
      </div>

      {loadingItems && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700 text-sm">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" /> Loading inventory items…
        </div>
      )}

      {/* Document Details */}
      <div className="border rounded-xl p-6 bg-white mb-6 shadow-sm">
        <h3 className="text-base font-semibold mb-5 text-[#105076]">Document Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="space-y-1.5"><Label className="text-xs font-medium">Document Number</Label><Input value={docNumber} readOnly className="h-10 bg-gray-100 font-mono text-sm" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">BOM Name <span className="text-red-500">*</span></Label><Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Enter BOM name" className="h-10" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Document Date</Label><Input type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} className="h-10" /></div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={(v: "planned" | "published" | "wip" | "completed") => setStatus(v)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="wip">WIP / In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">FG Store <span className="text-red-500">*</span></Label><WarehouseSelect value={fgStore} onChange={setFgStore} placeholder="Select FG Store" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">RM Store <span className="text-red-500">*</span></Label><WarehouseSelect value={rmStore} onChange={setRmStore} placeholder="Select RM Store" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Scrap/Reject Store <span className="text-red-500">*</span></Label><WarehouseSelect value={scrapStore} onChange={setScrapStore} placeholder="Select Scrap Store" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium">Attachments</Label><Button variant="outline" className="w-full h-10 border-dashed text-sm"><Plus className="h-4 w-4 mr-2" /> Add Attachments</Button></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowDescription(!showDescription)}>
                <FileText className="h-3.5 w-3.5 mr-1" />{showDescription ? "Hide" : "Add"}
              </Button>
            </div>
            {showDescription && <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="BOM description…" rows={3} />}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-medium">Internal Comments</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />{showComments ? "Hide" : "Add"}
              </Button>
            </div>
            {showComments && <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Internal notes…" rows={3} />}
          </div>
        </div>
        <p className="mt-4 pt-3 border-t text-xs text-gray-400">Last Modified: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>

      {/* BOM Levels */}
      {levels.map((levelData, idx) => (
        <BOMLevel
          key={idx}
          levelIndex={idx}
          data={levelData}
          fgItems={fgItems}
          rmItems={rmItems}
          scrapItems2={scrapItems2}
          onUpdate={(u) => updateLevel(idx, u)}
          onDelete={idx > 0 ? () => deleteLevel(idx) : undefined}
          childBOMExpandedSet={
            // Filter & remap the global set to a local (rmIdx-only) set for this level
            new Set(
              [...childBOMExpandedSet]
                .filter((k) => Math.floor(k / 10000) === idx)
                .map((k) => k % 10000)
            )
          }
          onOpenChildBOM={(rmIdx) => openChildBOM(idx, rmIdx)}
          onToggleChildBOMExpanded={(rmIdx) => toggleChildBOMExpanded(idx, rmIdx)}
          onUnlinkChildBOM={(rmIdx) => unlinkChildBOM(idx, rmIdx)}
        />
      ))}

      {/* Add Level */}
      <div className="flex justify-center py-8">
        <Button onClick={addNewLevel} size="lg" className="bg-[#105076] hover:bg-[#0d4566] text-white">
          <Plus className="h-6 w-6 mr-2" /> Add New BOM Level
        </Button>
      </div>

      <div className="sticky bottom-0 border-t bg-white shadow-lg mt-8 z-10">
        <div className="px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/production/bom/${id}`)} disabled={saving} className="min-w-[120px]">Cancel</Button>
          <Button variant="outline" onClick={handleSavePlanned} disabled={saving} className="min-w-[120px]">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save as Planned
          </Button>
          <Button onClick={handleSaveBOM} disabled={saving} className="bg-[#105076] hover:bg-[#0d4566] min-w-[120px]">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Update BOM
          </Button>
        </div>
      </div>

      {/* Link Child BOM Dialog */}
      <LinkChildBOMDialog
        open={childBOMDialogOpen}
        onClose={() => { setChildBOMDialogOpen(false); setChildBOMTargetIdx(null); }}
        onSave={handleChildBOMSave}
        currentChildBOM={childBOMTargetIdx !== null ? levels[childBOMTargetLevel]?.rawMaterials[childBOMTargetIdx]?.childBOM : null}
        itemId={childBOMTargetIdx !== null ? levels[childBOMTargetLevel]?.rawMaterials[childBOMTargetIdx]?.itemId : undefined}
      />
    </div>
  );
};

export default EditBOM;
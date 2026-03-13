import React, { useRef, useState, useEffect, useMemo } from "react";
import { X, Loader2, ArrowDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import { get } from "../../../lib/apiService";
import { stockTransferAPI } from "@/services/stockTransferService";

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Hierarchy types matching /inventory/store/stock/hierarchy/:warehouseId ───
interface HierarchyItem {
  itemId: number;
  itemName: string;
  sku: string;
  quantity: number;
}

interface HierarchyRack {
  rackId: number;
  rackName: string;
  items: HierarchyItem[];
}

interface HierarchyZone {
  zoneId: number;
  zoneName: string;
  racks: Record<string, HierarchyRack>;
}

interface WarehouseHierarchy {
  warehouseId: number;
  zones: Record<string, HierarchyZone>;
}

interface WarehouseOption {
  id: number;
  name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten all zones out of a hierarchy */
const getZones = (h: WarehouseHierarchy | null): HierarchyZone[] =>
  h ? Object.values(h.zones) : [];

/** Flatten all racks for a given zoneId */
const getRacks = (h: WarehouseHierarchy | null, zoneId: string): HierarchyRack[] => {
  if (!h || !zoneId) return [];
  const zone = h.zones[zoneId];
  return zone ? Object.values(zone.racks) : [];
};

/** Flatten all items for a given zoneId + rackId */
const getItems = (h: WarehouseHierarchy | null, zoneId: string, rackId: string): HierarchyItem[] => {
  if (!h || !zoneId || !rackId) return [];
  const zone = h.zones[zoneId];
  if (!zone) return [];
  const rack = zone.racks[rackId];
  return rack ? rack.items : [];
};

// ─────────────────────────────────────────────────────────────────────────────

const CreateStockTransferModal: React.FC<IModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);

  // FROM state
  const [fromWarehouseId, setFromWarehouseId] = useState<string>("");
  const [fromHierarchy, setFromHierarchy] = useState<WarehouseHierarchy | null>(null);
  const [fromHierarchyLoading, setFromHierarchyLoading] = useState(false);
  const [fromZoneId, setFromZoneId] = useState<string>("");
  const [fromRackId, setFromRackId] = useState<string>("");
  const [itemId, setItemId] = useState<string>("");

  // TO state
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [toHierarchy, setToHierarchy] = useState<WarehouseHierarchy | null>(null);
  const [toHierarchyLoading, setToHierarchyLoading] = useState(false);
  const [toZoneId, setToZoneId] = useState<string>("");
  const [toRackId, setToRackId] = useState<string>("");

  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [errors, setErrors] = useState({
    itemId: "", fromWarehouseId: "", fromZoneId: "", fromRackId: "",
    toWarehouseId: "", toZoneId: "", toRackId: "", quantity: "",
  });

  // ── Fetch warehouse list once on open ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    get("/inventory/warehouse")
      .then((d) => { if (d?.status) setWarehouses(d.data); })
      .catch(() => ErrorToast({ title: "Error", description: "Failed to fetch warehouses" }));
  }, [isOpen]);

  // ── Fetch hierarchy for FROM warehouse ──────────────────────────────────────
  useEffect(() => {
    setFromZoneId(""); setFromRackId(""); setItemId(""); setFromHierarchy(null);
    if (!fromWarehouseId) return;
    setFromHierarchyLoading(true);
    get(`/inventory/store/stock/hierarchy/${fromWarehouseId}`)
      .then((d) => { if (d?.status) setFromHierarchy(d.data); })
      .catch(() => ErrorToast({ title: "Error", description: "Failed to fetch source warehouse data" }))
      .finally(() => setFromHierarchyLoading(false));
  }, [fromWarehouseId]);

  // ── Fetch hierarchy for TO warehouse ────────────────────────────────────────
  useEffect(() => {
    setToZoneId(""); setToRackId(""); setToHierarchy(null);
    if (!toWarehouseId) return;
    setToHierarchyLoading(true);
    get(`/inventory/store/stock/hierarchy/${toWarehouseId}`)
      .then((d) => { if (d?.status) setToHierarchy(d.data); })
      .catch(() => ErrorToast({ title: "Error", description: "Failed to fetch destination warehouse data" }))
      .finally(() => setToHierarchyLoading(false));
  }, [toWarehouseId]);

  // Reset downstream when zone changes
  useEffect(() => { setFromRackId(""); setItemId(""); }, [fromZoneId]);
  useEffect(() => { setItemId(""); }, [fromRackId]);
  useEffect(() => { setToRackId(""); }, [toZoneId]);

  // ── Derived lists ────────────────────────────────────────────────────────────
  const fromZones  = useMemo(() => getZones(fromHierarchy), [fromHierarchy]);
  const fromRacks  = useMemo(() => getRacks(fromHierarchy, fromZoneId), [fromHierarchy, fromZoneId]);
  const fromItems  = useMemo(() => getItems(fromHierarchy, fromZoneId, fromRackId), [fromHierarchy, fromZoneId, fromRackId]);
  const toZones    = useMemo(() => getZones(toHierarchy), [toHierarchy]);
  const toRacks    = useMemo(() => getRacks(toHierarchy, toZoneId), [toHierarchy, toZoneId]);

  // Max quantity from selected item's stock
  const selectedItemStock = useMemo(
    () => fromItems.find((i) => String(i.itemId) === itemId)?.quantity ?? null,
    [fromItems, itemId],
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const clearError = (field: string) => setErrors((p) => ({ ...p, [field]: "" }));

  const validateFields = () => {
    const e = {
      itemId: !itemId ? "Please select an item" : "",
      fromWarehouseId: !fromWarehouseId ? "Please select source warehouse" : "",
      fromZoneId: !fromZoneId ? "Please select source zone" : "",
      fromRackId: !fromRackId ? "Please select source rack" : "",
      toWarehouseId: !toWarehouseId ? "Please select destination warehouse" : "",
      toZoneId: !toZoneId ? "Please select destination zone" : "",
      toRackId: !toRackId ? "Please select destination rack" : "",
      quantity:
        !quantity || quantity <= 0
          ? "Quantity must be greater than 0"
          : selectedItemStock !== null && quantity > selectedItemStock
          ? `Exceeds available stock (${selectedItemStock})`
          : "",
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const resetForm = () => {
    setFromWarehouseId(""); setFromHierarchy(null); setFromZoneId(""); setFromRackId(""); setItemId("");
    setToWarehouseId("");   setToHierarchy(null);   setToZoneId("");   setToRackId("");
    setQuantity(0); setReason("");
    setErrors({ itemId: "", fromWarehouseId: "", fromZoneId: "", fromRackId: "",
      toWarehouseId: "", toZoneId: "", toRackId: "", quantity: "" });
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;
    try {
      setIsLoading(true);
      const result = await stockTransferAPI.create({
        itemId: Number(itemId),
        fromWarehouseId: Number(fromWarehouseId),
        fromZoneId: Number(fromZoneId),
        fromRackId: Number(fromRackId),
        toWarehouseId: Number(toWarehouseId),
        toZoneId: Number(toZoneId),
        toRackId: Number(toRackId),
        quantity: Number(quantity),
        ...(reason ? { reason } : {}),
      });

      if (result.status) {
        SuccessToast({ title: "Success", description: "Stock transfer request created successfully" });
        resetForm();
        onClose();
      } else {
        const msg = result?.message || "Failed to create transfer stock request";
        ErrorToast({ title: "Transfer Failed", description: msg });
        if (msg.includes("Insufficient stock")) setErrors((p) => ({ ...p, quantity: msg }));
      }
    } catch (err: any) {
      let msg = "Failed to create transfer stock request. Please try again.";
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      ErrorToast({ title: "Error", description: msg });
      if (msg.includes("Insufficient stock")) setErrors((p) => ({ ...p, quantity: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // ── Shared field wrapper ─────────────────────────────────────────────────────
  const Field: React.FC<{ label: string; req?: boolean; err?: string; children: React.ReactNode }> = ({
    label, req, err, children,
  }) => (
    <div>
      <Label className={labelClasses}>
        {label}{req && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="mt-1">{children}</div>
      {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
    </div>
  );

  // Spinner shown while hierarchy loads — plain div, NOT inside a Select
  const LoadingTrigger = ({ placeholder }: { placeholder: string }) => (
    <div className={`${inputClasses} w-full flex items-center gap-2 h-9 px-3 rounded-md border border-neutral-200/70 bg-white opacity-60 cursor-not-allowed`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />
      <span className="text-sm text-gray-400">{placeholder}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-xl animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h4 className="font-semibold md:text-lg lg:text-xl">Stock Transfer</h4>
          <X
            className={`text-[#8A8AA3] w-5 ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            onClick={() => !isLoading && onClose()}
          />
        </div>

        <div className="p-6 space-y-5">

          {/* ── FROM section ─────────────────────────────────────────────────── */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">From</p>

            {/* Warehouse */}
            <Field label="Warehouse" req err={errors.fromWarehouseId}>
              <Select
                value={fromWarehouseId}
                onValueChange={(v) => { setFromWarehouseId(v); clearError("fromWarehouseId"); }}
                disabled={isLoading}
              >
                <SelectTrigger className={`${inputClasses} w-full ${errors.fromWarehouseId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select source warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Zone */}
            <Field label="Zone" req err={errors.fromZoneId}>
              {fromHierarchyLoading ? (
                <LoadingTrigger placeholder="Loading zones…" />
              ) : (
                <Select
                  value={fromZoneId}
                  onValueChange={(v) => { setFromZoneId(v); clearError("fromZoneId"); }}
                  disabled={isLoading || !fromWarehouseId || fromZones.length === 0}
                >
                  <SelectTrigger className={`${inputClasses} w-full ${errors.fromZoneId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder={
                      !fromWarehouseId ? "Select warehouse first" :
                      fromZones.length === 0 ? "No zones available" :
                      "Select source zone"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {fromZones.map((z) => (
                        <SelectItem key={z.zoneId} value={String(z.zoneId)}>{z.zoneName}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </Field>

            {/* Rack */}
            <Field label="Rack" req err={errors.fromRackId}>
              <Select
                value={fromRackId}
                onValueChange={(v) => { setFromRackId(v); clearError("fromRackId"); }}
                disabled={isLoading || !fromZoneId || fromRacks.length === 0}
              >
                <SelectTrigger className={`${inputClasses} w-full ${errors.fromRackId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={
                    !fromZoneId ? "Select zone first" :
                    fromRacks.length === 0 ? "No racks available" :
                    "Select source rack"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {fromRacks.map((r) => (
                      <SelectItem key={r.rackId} value={String(r.rackId)}>{r.rackName}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Item — filtered by warehouse → zone → rack */}
            <Field label="Item" req err={errors.itemId}>
              <Select
                value={itemId}
                onValueChange={(v) => { setItemId(v); clearError("itemId"); setQuantity(0); }}
                disabled={isLoading || !fromRackId || fromItems.length === 0}
              >
                <SelectTrigger className={`${inputClasses} w-full ${errors.itemId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={
                    !fromRackId ? "Select rack first" :
                    fromItems.length === 0 ? "No items in this rack" :
                    "Select item"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {fromItems.map((i) => (
                      <SelectItem key={i.itemId} value={String(i.itemId)}>
                        <span className="flex items-center justify-between gap-3 w-full">
                          <span>{i.itemName}</span>
                          <span className="text-xs text-gray-400 font-mono">{i.sku}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {/* Show available stock hint */}
              {selectedItemStock !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  Available stock: <span className="font-medium text-gray-700">{selectedItemStock}</span>
                </p>
              )}
            </Field>
          </div>

          {/* Arrow separator */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="h-px w-16 bg-gray-200" />
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7047EB]/10 border border-[#7047EB]/20">
                <ArrowDown className="w-4 h-4 text-[#7047EB]" />
              </div>
              <div className="h-px w-16 bg-gray-200" />
            </div>
          </div>

          {/* ── TO section ───────────────────────────────────────────────────── */}
          <div className="rounded-lg border border-green-100 bg-green-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">To</p>

            {/* Warehouse */}
            <Field label="Warehouse" req err={errors.toWarehouseId}>
              <Select
                value={toWarehouseId}
                onValueChange={(v) => { setToWarehouseId(v); clearError("toWarehouseId"); }}
                disabled={isLoading}
              >
                <SelectTrigger className={`${inputClasses} w-full ${errors.toWarehouseId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Zone */}
            <Field label="Zone" req err={errors.toZoneId}>
              {toHierarchyLoading ? (
                <LoadingTrigger placeholder="Loading zones…" />
              ) : (
                <Select
                  value={toZoneId}
                  onValueChange={(v) => { setToZoneId(v); clearError("toZoneId"); }}
                  disabled={isLoading || !toWarehouseId || toZones.length === 0}
                >
                  <SelectTrigger className={`${inputClasses} w-full ${errors.toZoneId ? "border-red-500" : ""}`}>
                    <SelectValue placeholder={
                      !toWarehouseId ? "Select warehouse first" :
                      toZones.length === 0 ? "No zones available" :
                      "Select destination zone"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {toZones.map((z) => (
                        <SelectItem key={z.zoneId} value={String(z.zoneId)}>{z.zoneName}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </Field>

            {/* Rack */}
            <Field label="Rack" req err={errors.toRackId}>
              <Select
                value={toRackId}
                onValueChange={(v) => { setToRackId(v); clearError("toRackId"); }}
                disabled={isLoading || !toZoneId || toRacks.length === 0}
              >
                <SelectTrigger className={`${inputClasses} w-full ${errors.toRackId ? "border-red-500" : ""}`}>
                  <SelectValue placeholder={
                    !toZoneId ? "Select zone first" :
                    toRacks.length === 0 ? "No racks available" :
                    "Select destination rack"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {toRacks.map((r) => (
                      <SelectItem key={r.rackId} value={String(r.rackId)}>{r.rackName}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Quantity */}
          <Field label="Quantity" req err={errors.quantity}>
            <Input
              type="number"
              className={`${inputClasses} w-full ${errors.quantity ? "border-red-500" : ""}`}
              value={quantity}
              onChange={(e) => { setQuantity(Number(e.target.value)); clearError("quantity"); }}
              min={1}
              max={selectedItemStock ?? undefined}
              disabled={isLoading || !itemId}
              placeholder={!itemId ? "Select item first" : "Enter quantity"}
            />
          </Field>

          {/* Reason */}
          <Field label="Reason (Optional)">
            <Input
              type="text"
              className={`${inputClasses} w-full`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stock rebalancing"
              disabled={isLoading}
            />
          </Field>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full mt-2 bg-[#7047EB] text-white py-2.5 rounded-md hover:bg-[#5a37c6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
            ) : (
              "Submit Transfer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStockTransferModal;
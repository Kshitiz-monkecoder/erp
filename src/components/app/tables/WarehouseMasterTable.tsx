import React, { useEffect, useState, useCallback } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  PlusIcon,
  Edit2,
  Trash2,
  Layers,
  Grid3X3,
  Warehouse,
  Plus,
  Loader2,
  X,
  MapPin,
  Package,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import { IModalProps } from "@/lib/types";
import TableLoading from "../TableLoading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import {
  warehouseAPI,
  zoneAPI,
  rackAPI,
  WarehouseItem,
  ZoneItem,
  RackItem,
} from "../../../services/warehouseService";

interface WarehouseMasterTableProps extends Omit<IModalProps, "isOpen"> {
  toggleEditWarehouseModal?: (w: any) => void;
  refreshTrigger?: number;
}

// Small Modal Shell
interface SmallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SmallModal: React.FC<SmallModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-6">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-5 py-3.5 bg-neutral-50 border-b border-neutral-100 rounded-t-xl flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">x</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Confirm Delete Modal
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  isLoading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, label, isLoading }) => (
  <SmallModal isOpen={isOpen} onClose={onClose} title="Confirm Delete">
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Trash2 className="w-4 h-4 text-red-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 mb-1">Delete "{label}"?</p>
        <p className="text-xs text-gray-500">This action cannot be undone. All nested data will be permanently removed.</p>
      </div>
    </div>
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose} disabled={isLoading} className="shadow-none text-xs h-8">Cancel</Button>
      <Button onClick={onConfirm} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white text-xs h-8 shadow-none border-0">
        {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Deleting...</> : "Delete"}
      </Button>
    </div>
  </SmallModal>
);

// Zone Modal
interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number;
  warehouseName: string;
  zone?: ZoneItem | null;
  onSuccess: () => void;
}

const ZoneModal: React.FC<ZoneModalProps> = ({ isOpen, onClose, warehouseId, warehouseName, zone, onSuccess }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) { setName(zone?.name ?? ""); setDescription(zone?.description ?? ""); setErrors({}); }
  }, [isOpen, zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrors({ name: "Zone name is required" }); return; }
    setIsLoading(true);
    try {
      if (zone?.id) {
        await zoneAPI.updateZone(zone.id, { name: name.trim(), description: description.trim() });
        SuccessToast({ title: "Zone updated successfully.", description: "" });
      } else {
        await zoneAPI.createZone({ warehouseId, name: name.trim(), description: description.trim() });
        SuccessToast({ title: "Zone added successfully.", description: "" });
      }
      onSuccess(); onClose();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to save zone.", description: "" });
    } finally { setIsLoading(false); }
  };

  return (
    <SmallModal isOpen={isOpen} onClose={onClose} title={zone ? "Edit Zone" : `Add Zone — ${warehouseName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label className={labelClasses}>Zone Name <span className="text-[#F53D6B]">*</span></Label>
          <Input className={`${inputClasses} border ${errors.name ? "border-red-400" : "border-neutral-200"}`} placeholder="e.g. Raw Material Zone" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} disabled={isLoading} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Description</Label>
          <Input className={`${inputClasses} border border-neutral-200`} placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="shadow-none text-xs h-8">Cancel</Button>
          <Button type="submit" disabled={isLoading} className="bg-[#7047EB] text-xs h-8 shadow-none hover:bg-[#7047EB] hover:opacity-95">
            {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : zone ? "Update" : "Add Zone"}
          </Button>
        </div>
      </form>
    </SmallModal>
  );
};

// Rack Modal
interface RackModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: number;
  zoneName: string;
  rack?: RackItem | null;
  onSuccess: () => void;
}

const RackModal: React.FC<RackModalProps> = ({ isOpen, onClose, zoneId, zoneName, rack, onSuccess }) => {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) { setName(rack?.name ?? ""); setCapacity(rack?.capacity?.toString() ?? ""); setDescription(rack?.description ?? ""); setErrors({}); }
  }, [isOpen, rack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrors({ name: "Rack name is required" }); return; }
    setIsLoading(true);
    try {
      if (rack?.id) {
        await rackAPI.updateRack(rack.id, { name: name.trim(), capacity: capacity ? Number(capacity) : undefined, description: description.trim() });
        SuccessToast({ title: "Rack updated successfully.", description: "" });
      } else {
        await rackAPI.createRack({ zoneId, name: name.trim(), capacity: capacity ? Number(capacity) : undefined, description: description.trim() });
        SuccessToast({ title: "Rack added successfully.", description: "" });
      }
      onSuccess(); onClose();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to save rack.", description: "" });
    } finally { setIsLoading(false); }
  };

  return (
    <SmallModal isOpen={isOpen} onClose={onClose} title={rack ? "Edit Rack / Bin" : `Add Rack / Bin — ${zoneName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label className={labelClasses}>Rack / Bin Name <span className="text-[#F53D6B]">*</span></Label>
          <Input className={`${inputClasses} border ${errors.name ? "border-red-400" : "border-neutral-200"}`} placeholder="e.g. Rack A1" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} disabled={isLoading} />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Capacity</Label>
          <Input type="number" min="0" className={`${inputClasses} border border-neutral-200`} placeholder="Units" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={isLoading} />
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Description</Label>
          <Input className={`${inputClasses} border border-neutral-200`} placeholder="Optional description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="shadow-none text-xs h-8">Cancel</Button>
          <Button type="submit" disabled={isLoading} className="bg-[#7047EB] text-xs h-8 shadow-none hover:bg-[#7047EB] hover:opacity-95">
            {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : rack ? "Update" : "Add Rack"}
          </Button>
        </div>
      </form>
    </SmallModal>
  );
};

// Zone Card (inside drawer)
interface ZoneCardProps {
  zone: ZoneItem;
  warehouseId: number;
  onZoneEdit: (zone: ZoneItem) => void;
  onZoneDelete: (zone: ZoneItem) => void;
  onRefresh: () => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, onZoneEdit, onZoneDelete, onRefresh }) => {
  const [expanded, setExpanded] = useState(true);
  const [addRackOpen, setAddRackOpen] = useState(false);
  const [editRack, setEditRack] = useState<RackItem | null>(null);
  const [deleteRack, setDeleteRack] = useState<RackItem | null>(null);
  const [isDeletingRack, setIsDeletingRack] = useState(false);

  const racks = zone.racks ?? [];

  const handleDeleteRack = async () => {
    if (!deleteRack) return;
    setIsDeletingRack(true);
    try {
      await rackAPI.deleteRack(deleteRack.id);
      SuccessToast({ title: "Rack deleted successfully.", description: "" });
      setDeleteRack(null);
      onRefresh();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to delete rack.", description: "" });
    } finally { setIsDeletingRack(false); }
  };

  return (
    <>
      <div className="rounded-xl border border-violet-100 bg-white shadow-sm overflow-hidden">
        {/* Zone header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50/60 border-b border-violet-100">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setExpanded(v => !v)} className="text-violet-400 hover:text-violet-600 flex-shrink-0 transition-colors">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">{zone.name}</span>
                {zone.code && (
                  <span className="text-xs font-mono text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded flex-shrink-0">{zone.code}</span>
                )}
              </div>
              {zone.description && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{zone.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => setAddRackOpen(true)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium bg-[#7047EB] text-white hover:bg-[#7047EB]/90 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" /> Add Rack
            </button>
            <button onClick={() => onZoneEdit(zone)} className="w-6 h-6 rounded-md flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit Zone">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onZoneDelete(zone)} className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete Zone">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Racks grid */}
        {expanded && (
          <div className="p-3">
            {racks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mb-2">
                  <Grid3X3 className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 mb-2">No racks yet</p>
                <button onClick={() => setAddRackOpen(true)} className="text-xs text-[#7047EB] font-medium hover:underline">+ Add Rack</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {racks.map(rack => (
                  <div
                    key={rack.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setEditRack(rack)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Grid3X3 className="w-3 h-3 text-violet-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-700 truncate">{rack.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditRack(rack); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteRack(rack); }}
                          className="w-5 h-5 rounded flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    {rack.capacity != null && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Package className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-xs text-gray-400">{rack.capacity} units</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <RackModal isOpen={addRackOpen} onClose={() => setAddRackOpen(false)} zoneId={zone.id} zoneName={zone.name} onSuccess={onRefresh} />
      <RackModal isOpen={!!editRack} onClose={() => setEditRack(null)} zoneId={zone.id} zoneName={zone.name} rack={editRack} onSuccess={onRefresh} />
      <ConfirmDeleteModal isOpen={!!deleteRack} onClose={() => setDeleteRack(null)} onConfirm={handleDeleteRack} label={deleteRack?.name ?? ""} isLoading={isDeletingRack} />
    </>
  );
};

// Warehouse Detail Drawer
interface WarehouseDrawerProps {
  warehouse: WarehouseItem | null;
  isOpen: boolean;
  onClose: () => void;
  onWarehouseEdit: (w: WarehouseItem) => void;
  onRefresh: () => void;
}

const WarehouseDrawer: React.FC<WarehouseDrawerProps> = ({ warehouse, isOpen, onClose, onWarehouseEdit, onRefresh }) => {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editZone, setEditZone] = useState<ZoneItem | null>(null);
  const [deleteZone, setDeleteZone] = useState<ZoneItem | null>(null);
  const [isDeletingZone, setIsDeletingZone] = useState(false);

  const fetchHierarchy = useCallback(async () => {
    if (!warehouse) return;
    setIsLoading(true);
    try {
      const result = await warehouseAPI.getWarehouseHierarchy(warehouse.id);
      if (result.status) setZones(result.data.zones ?? []);
    } catch {
      setZones(warehouse.zones ?? []);
    } finally { setIsLoading(false); }
  }, [warehouse]);

  useEffect(() => {
    if (isOpen && warehouse) fetchHierarchy();
    else setZones([]);
  }, [isOpen, warehouse]);

  const handleRefresh = useCallback(async () => {
    await fetchHierarchy();
    onRefresh();
  }, [fetchHierarchy, onRefresh]);

  const handleDeleteZone = async () => {
    if (!deleteZone) return;
    setIsDeletingZone(true);
    try {
      await zoneAPI.deleteZone(deleteZone.id);
      SuccessToast({ title: "Zone deleted successfully.", description: "" });
      setDeleteZone(null);
      handleRefresh();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to delete zone.", description: "" });
    } finally { setIsDeletingZone(false); }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const totalRacks = zones.reduce((t, z) => t + (z.racks?.length ?? 0), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] max-w-full bg-gray-50 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100">
          {/* Warehouse info */}
          <div className="px-5 py-4 bg-gradient-to-br from-[#7047EB]/8 via-violet-50/60 to-white">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#7047EB]/10 border border-[#7047EB]/15 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#7047EB]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 truncate">{warehouse?.name}</h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{warehouse?.city} · {warehouse?.postalCode}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => warehouse && onWarehouseEdit(warehouse)}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Address */}
            <div className="text-xs text-gray-500 bg-white/80 rounded-lg px-3 py-2 border border-gray-100 mb-3">
              {warehouse?.address1}{warehouse?.address2 ? `, ${warehouse.address2}` : ""}
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-violet-100 rounded-lg px-3 py-1.5 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-bold text-gray-800">{zones.length}</span>
                <span className="text-xs text-gray-400">Zone{zones.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
                <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-bold text-gray-800">{totalRacks}</span>
                <span className="text-xs text-gray-400">Rack{totalRacks !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* Section bar */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-50">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Zones & Racks</span>
            <button
              onClick={() => setAddZoneOpen(true)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-medium bg-[#7047EB] text-white hover:bg-[#7047EB]/90 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3" /> Add Zone
            </button>
          </div>
        </div>

        {/* Scrollable zone list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#7047EB]/40" />
              <span className="text-xs text-gray-400">Loading zones...</span>
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Layers className="w-7 h-7 text-violet-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">No zones yet</p>
                <p className="text-xs text-gray-400 leading-relaxed">Add a zone to start organizing racks and bins inside this warehouse.</p>
              </div>
              <button
                onClick={() => setAddZoneOpen(true)}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-xs font-medium bg-[#7047EB] text-white hover:bg-[#7047EB]/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Zone
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {zones.map(zone => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  warehouseId={warehouse?.id ?? 0}
                  onZoneEdit={(z) => setEditZone(z)}
                  onZoneDelete={(z) => setDeleteZone(z)}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {warehouse && (
        <>
          <ZoneModal isOpen={addZoneOpen} onClose={() => setAddZoneOpen(false)} warehouseId={warehouse.id} warehouseName={warehouse.name} onSuccess={handleRefresh} />
          <ZoneModal isOpen={!!editZone} onClose={() => setEditZone(null)} warehouseId={warehouse.id} warehouseName={warehouse.name} zone={editZone} onSuccess={handleRefresh} />
        </>
      )}
      <ConfirmDeleteModal isOpen={!!deleteZone} onClose={() => setDeleteZone(null)} onConfirm={handleDeleteZone} label={deleteZone?.name ?? ""} isLoading={isDeletingZone} />
    </>
  );
};

// Main Table
const WarehouseMasterTable: React.FC<WarehouseMasterTableProps> = ({ onClose, toggleEditWarehouseModal, refreshTrigger }) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const triggerRefresh = useCallback(() => setInternalRefresh((v) => v + 1), []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      setIsLoading(true);
      try {
        const result = await warehouseAPI.getAllWarehouses();
        setItems(result.data ?? []);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
        ErrorToast({ title: "Failed to fetch warehouses.", description: "" });
      } finally { setIsLoading(false); }
    };
    fetchWarehouses();
  }, [refreshTrigger, internalRefresh]);

  const openDrawer = (warehouse: WarehouseItem) => {
    setSelectedWarehouse(warehouse);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedWarehouse(null), 300);
  };

  const columns: ColumnDef<WarehouseItem>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Address 1", accessorKey: "address1" },
    { header: "Address 2", accessorKey: "address2" },
    { header: "City", accessorKey: "city" },
    { header: "Postal Code", accessorKey: "postalCode" },
    { header: "Action", accessorKey: "action" },
  ];

  const table = useReactTable({
    data: items,
    columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  });

  return (
    <div>
      <div className="space-y-6">
        {/* Toolbar */}
        <section className="px-5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">Click any row to manage zones &amp; racks</p>
            <Button onClick={onClose} className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
              <PlusIcon className="w-4 h-4 mr-1" />Add Warehouse
            </Button>
          </div>
        </section>

        {/* Table */}
        <div className="px-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border">
                <TableHead className="relative h-10 border-t border-r select-none">Name</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Address 1</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Address 2</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">City</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Postal Code</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableLoading columnLength={6} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-96 text-center">
                      <div className="w-full flex flex-col gap-3 justify-center items-center">
                        <img src="/folder.svg" alt="" />
                        <h4 className="font-bold text-lg">No Warehouse Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">Please add a warehouse to get started and manage your operations efficiently.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const warehouse = row.original;
                    const isSelected = selectedWarehouse?.id === warehouse.id && drawerOpen;
                    return (
                      <TableRow
                        key={warehouse.id}
                        className={`cursor-pointer transition-all duration-150 ${isSelected ? "bg-violet-50/80 border-l-[3px] border-l-[#7047EB]" : "hover:bg-gray-50/70 border-l-[3px] border-l-transparent"}`}
                        onClick={() => openDrawer(warehouse)}
                      >
                        <TableCell className="border-r border-b px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#7047EB]/10" : "bg-gray-100"}`}>
                              <Warehouse className={`w-3.5 h-3.5 ${isSelected ? "text-[#7047EB]" : "text-gray-400"}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-800">{warehouse.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r border-b px-3 py-2.5 text-sm text-gray-600">{warehouse.address1}</TableCell>
                        <TableCell className="border-r border-b px-3 py-2.5 text-sm text-gray-500">{warehouse.address2 || <span className="text-gray-300">—</span>}</TableCell>
                        <TableCell className="border-r border-b px-3 py-2.5 text-sm text-gray-600">{warehouse.city}</TableCell>
                        <TableCell className="border-r border-b px-3 py-2.5 text-sm text-gray-600">{warehouse.postalCode}</TableCell>
                        <TableCell className="border-r border-b px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-violet-400 hover:text-violet-700 hover:bg-violet-50"
                              onClick={(e) => { e.stopPropagation(); openDrawer(warehouse); }}
                              title="View Zones & Racks"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={(e) => { e.stopPropagation(); toggleEditWarehouseModal?.(warehouse); }}
                              title="Edit Warehouse"
                            >
                              <Edit2 size={13} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>
        </div>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-5">
            <div className="flex gap-3 md:gap-5">
              <div className="flex items-center text-neutral-600 gap-2">
                <div className="text-xs">Rows per page:</div>
                <select className="text-xs bg-neutral-100 shadow rounded-sm px-2 py-1 cursor-pointer" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                  {[10, 20, 30, 40, 50].map((pageSize) => <option key={pageSize} value={pageSize}>{pageSize}</option>)}
                </select>
              </div>
              <button className="text-neutral-600" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>{"<<"}</button>
              <button className="text-neutral-600" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{"<"}</button>
              <button className="text-neutral-600" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{">"}</button>
              <button className="text-neutral-600" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>{">>"}</button>
            </div>
            <span className="text-xs text-neutral-600">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
          </div>
        )}
      </div>

      <WarehouseDrawer
        warehouse={selectedWarehouse}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onWarehouseEdit={(w) => { closeDrawer(); toggleEditWarehouseModal?.(w); }}
        onRefresh={triggerRefresh}
      />
    </div>
  );
};

export default WarehouseMasterTable;
import React, { useEffect, useState, useCallback } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  // flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  PlusIcon,
  Edit2,
  ChevronRight,
  ChevronDown,
  Layers,
  Grid3X3,
  Warehouse,
  Plus,
  Loader2,
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
// import MultiSelectWithSearch from "../MultiSelectWithSearch";
import { IModalProps } from "@/lib/types";
import TableLoading from "../TableLoading";
import { get, post, put } from "../../../lib/apiService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";

// ─── Types ─────────────────────────────────────────────────────────────────────

type RackItem = {
  id: number;
  name: string;
  code?: string;
  capacity?: number;
  description?: string;
};

type ZoneItem = {
  id: number;
  name: string;
  code?: string;
  description?: string;
  racks?: RackItem[];
};

type WarehouseItem = {
  id: number;
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  zones?: ZoneItem[];
};

interface WarehouseMasterTableProps extends Omit<IModalProps, "isOpen"> {
  toggleEditWarehouseModal?: (w: WarehouseItem) => void;
  refreshTrigger?: number;
}

// ─── Inline small modal shell ─────────────────────────────────────────────────

interface SmallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SmallModal: React.FC<SmallModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg w-full max-w-md animate-in fade-in duration-200 shadow-xl">
        <div className="px-5 py-3.5 bg-neutral-100/90 rounded-t-lg flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Add / Edit Zone Modal ─────────────────────────────────────────────────────

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number;
  warehouseName: string;
  zone?: ZoneItem | null; // if present → edit mode
  onSuccess: () => void;
}

const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  warehouseName,
  zone,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setName(zone?.name ?? "");
      setCode(zone?.code ?? "");
      setDescription(zone?.description ?? "");
      setErrors({});
    }
  }, [isOpen, zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Zone name is required" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = { name: name.trim(), code: code.trim(), description: description.trim(), warehouse: warehouseId };
      if (zone?.id) {
        await put(`/inventory/warehouse/zone/${zone.id}`, payload);
        SuccessToast({ title: "Zone updated successfully.", description: "" });
      } else {
        await post(`/inventory/warehouse/zone`, payload);
        SuccessToast({ title: "Zone added successfully.", description: "" });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to save zone.", description: "" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SmallModal isOpen={isOpen} onClose={onClose} title={zone ? "Edit Zone" : `Add Zone — ${warehouseName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label className={labelClasses}>Zone Name <span className="text-[#F53D6B]">*</span></Label>
          <Input
            className={`${inputClasses} border ${errors.name ? "border-red-400" : "border-neutral-200"}`}
            placeholder="e.g. Raw Material Zone"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors({}); }}
            disabled={isLoading}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Zone Code</Label>
          <Input
            className={`${inputClasses} border border-neutral-200`}
            placeholder="e.g. RMZ-01"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Description</Label>
          <Input
            className={`${inputClasses} border border-neutral-200`}
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="shadow-none text-xs h-8">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#7047EB] text-xs h-8 shadow-none hover:bg-[#7047EB] hover:opacity-95"
          >
            {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : (zone ? "Update" : "Add Zone")}
          </Button>
        </div>
      </form>
    </SmallModal>
  );
};

// ─── Add / Edit Rack Modal ─────────────────────────────────────────────────────

interface RackModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: number;
  zoneName: string;
  rack?: RackItem | null;
  onSuccess: () => void;
}

const RackModal: React.FC<RackModalProps> = ({
  isOpen,
  onClose,
  zoneId,
  zoneName,
  rack,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setName(rack?.name ?? "");
      setCode(rack?.code ?? "");
      setCapacity(rack?.capacity?.toString() ?? "");
      setDescription(rack?.description ?? "");
      setErrors({});
    }
  }, [isOpen, rack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: "Rack name is required" });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        description: description.trim(),
        zone: zoneId,
      };
      if (rack?.id) {
        await put(`/inventory/warehouse/rack/${rack.id}`, payload);
        SuccessToast({ title: "Rack updated successfully.", description: "" });
      } else {
        await post(`/inventory/warehouse/rack`, payload);
        SuccessToast({ title: "Rack added successfully.", description: "" });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      ErrorToast({ title: err?.message || "Failed to save rack.", description: "" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SmallModal isOpen={isOpen} onClose={onClose} title={rack ? "Edit Rack / Bin" : `Add Rack / Bin — ${zoneName}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label className={labelClasses}>Rack / Bin Name <span className="text-[#F53D6B]">*</span></Label>
          <Input
            className={`${inputClasses} border ${errors.name ? "border-red-400" : "border-neutral-200"}`}
            placeholder="e.g. Rack A1"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors({}); }}
            disabled={isLoading}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className={labelClasses}>Rack Code</Label>
            <Input
              className={`${inputClasses} border border-neutral-200`}
              placeholder="e.g. B3-04"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="w-28 space-y-1">
            <Label className={labelClasses}>Capacity</Label>
            <Input
              type="number"
              min="0"
              className={`${inputClasses} border border-neutral-200`}
              placeholder="Units"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className={labelClasses}>Description</Label>
          <Input
            className={`${inputClasses} border border-neutral-200`}
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="shadow-none text-xs h-8">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#7047EB] text-xs h-8 shadow-none hover:bg-[#7047EB] hover:opacity-95"
          >
            {isLoading ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving...</> : (rack ? "Update" : "Add Rack")}
          </Button>
        </div>
      </form>
    </SmallModal>
  );
};

// ─── Zone Row (expandable into racks) ─────────────────────────────────────────

interface ZoneRowProps {
  zone: ZoneItem;
  warehouseId: number;
  onZoneEdit: (zone: ZoneItem) => void;
  onRefresh: () => void;
}

const ZoneRow: React.FC<ZoneRowProps> = ({ zone,  onZoneEdit, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [addRackOpen, setAddRackOpen] = useState(false);
  const [editRack, setEditRack] = useState<RackItem | null>(null);

  const racks = zone.racks ?? [];

  return (
    <>
      {/* Zone row */}
      <TableRow className="bg-violet-50/40 hover:bg-violet-50/70 border-b border-violet-100">
        <TableCell className="border px-3 py-2 w-8">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-violet-500 hover:text-violet-700 transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </TableCell>
        <TableCell className="border px-3 py-2" colSpan={2}>
          <div className="flex items-center gap-2">
            <span className="pl-4 inline-flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <Layers className="w-3.5 h-3.5" />
              {zone.name}
            </span>
            {zone.code && (
              <span className="text-xs text-violet-400 font-mono bg-violet-100 px-1.5 py-0.5 rounded">
                {zone.code}
              </span>
            )}
            {zone.description && (
              <span className="text-xs text-gray-400 truncate max-w-40">{zone.description}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="border px-3 py-2" colSpan={3}>
          <span className="text-xs text-gray-400">
            {racks.length} rack{racks.length !== 1 ? "s" : ""}
          </span>
        </TableCell>
        <TableCell className="border px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
              onClick={() => setAddRackOpen(true)}
              title="Add Rack"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onZoneEdit(zone)}
              title="Edit Zone"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Rack rows */}
      {expanded && racks.length === 0 && (
        <TableRow className="bg-gray-50/30">
          <TableCell colSpan={7} className="border px-3 py-2 text-center">
            <span className="text-xs text-gray-400 italic">No racks added yet.</span>
            <button
              onClick={() => setAddRackOpen(true)}
              className="ml-2 text-xs text-[#7047EB] underline"
            >
              Add Rack
            </button>
          </TableCell>
        </TableRow>
      )}

      {expanded &&
        racks.map((rack) => (
          <TableRow key={rack.id} className="bg-gray-50/20 hover:bg-gray-50/60">
            <TableCell className="border px-3 py-1.5" />
            <TableCell className="border px-3 py-1.5" colSpan={2}>
              <div className="flex items-center gap-2 pl-10">
                <Grid3X3 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700">{rack.name}</span>
                {rack.code && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    {rack.code}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="border px-3 py-1.5" colSpan={3}>
              <div className="flex items-center gap-3">
                {rack.capacity != null && (
                  <span className="text-xs text-gray-400">
                    Capacity: <span className="text-gray-600 font-medium">{rack.capacity}</span>
                  </span>
                )}
                {rack.description && (
                  <span className="text-xs text-gray-400 truncate max-w-40">{rack.description}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="border px-3 py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => setEditRack(rack)}
                title="Edit Rack"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}

      {/* Add Rack Modal */}
      <RackModal
        isOpen={addRackOpen}
        onClose={() => setAddRackOpen(false)}
        zoneId={zone.id}
        zoneName={zone.name}
        onSuccess={onRefresh}
      />

      {/* Edit Rack Modal */}
      <RackModal
        isOpen={!!editRack}
        onClose={() => setEditRack(null)}
        zoneId={zone.id}
        zoneName={zone.name}
        rack={editRack}
        onSuccess={onRefresh}
      />
    </>
  );
};

// ─── Warehouse Row (expandable into zones) ────────────────────────────────────

interface WarehouseRowProps {
  warehouse: WarehouseItem;
  onWarehouseEdit: (w: WarehouseItem) => void;
  onRefresh: () => void;
}

const WarehouseRow: React.FC<WarehouseRowProps> = ({ warehouse, onWarehouseEdit, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [editZone, setEditZone] = useState<ZoneItem | null>(null);

  const zones = warehouse.zones ?? [];

  return (
    <>
      {/* Warehouse row */}
      <TableRow className="hover:bg-gray-50/50">
        <TableCell className="border px-3 py-2.5 w-8">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </TableCell>
        <TableCell className="border px-3 py-2.5">
          <div className="flex items-center gap-2 font-normal min-w-32">
            <Warehouse className="w-4 h-4 text-[#7047EB] flex-shrink-0" />
            <span className="text-sm font-medium">{warehouse.name}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">
              {zones.length} zone{zones.length !== 1 ? "s" : ""}
            </span>
          </div>
        </TableCell>
        <TableCell className="border px-3 py-2.5 font-normal text-sm min-w-32">
          {warehouse.address1}
        </TableCell>
        <TableCell className="border px-3 py-2.5 font-normal text-sm min-w-32">
          {warehouse.address2 || <span className="text-gray-300">—</span>}
        </TableCell>
        <TableCell className="border px-3 py-2.5 font-normal text-sm min-w-32">
          {warehouse.city}
        </TableCell>
        <TableCell className="border px-3 py-2.5 font-normal text-sm min-w-24">
          {warehouse.postalCode}
        </TableCell>
        <TableCell className="border px-3 py-2.5">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-violet-500 hover:text-violet-700 hover:bg-violet-50"
              onClick={() => setAddZoneOpen(true)}
              title="Add Zone"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
              onClick={() => onWarehouseEdit(warehouse)}
              title="Edit Warehouse"
            >
              <Edit2 size={15} />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Zone rows */}
      {expanded && zones.length === 0 && (
        <TableRow className="bg-violet-50/20">
          <TableCell colSpan={7} className="border px-3 py-2 text-center">
            <span className="text-xs text-gray-400 italic">No zones added yet.</span>
            <button
              onClick={() => setAddZoneOpen(true)}
              className="ml-2 text-xs text-[#7047EB] underline"
            >
              Add Zone
            </button>
          </TableCell>
        </TableRow>
      )}

      {expanded &&
        zones.map((zone) => (
          <ZoneRow
            key={zone.id}
            zone={zone}
            warehouseId={warehouse.id}
            onZoneEdit={(z) => setEditZone(z)}
            onRefresh={onRefresh}
          />
        ))}

      {/* Add Zone Modal */}
      <ZoneModal
        isOpen={addZoneOpen}
        onClose={() => setAddZoneOpen(false)}
        warehouseId={warehouse.id}
        warehouseName={warehouse.name}
        onSuccess={onRefresh}
      />

      {/* Edit Zone Modal */}
      <ZoneModal
        isOpen={!!editZone}
        onClose={() => setEditZone(null)}
        warehouseId={warehouse.id}
        warehouseName={warehouse.name}
        zone={editZone}
        onSuccess={onRefresh}
      />
    </>
  );
};

// ─── Main Table ───────────────────────────────────────────────────────────────

const WarehouseMasterTable: React.FC<WarehouseMasterTableProps> = ({
  onClose,
  toggleEditWarehouseModal,
  refreshTrigger,
}) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);

  const triggerRefresh = useCallback(() => setInternalRefresh((v) => v + 1), []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setIsLoading(true);
        // Try to fetch with zones+racks. Fall back to flat list if endpoint doesn't support it.
        let data: WarehouseItem[] = [];
        try {
          const result = await get("/inventory/warehouse?include=zones,racks");
          data = result.data ?? [];
        } catch {
          const result = await get("/inventory/warehouse");
          data = result.data ?? [];
        }

        // If zones are not embedded, fetch per-warehouse (graceful degradation)
        // Backend should ideally return nested zones+racks in the list endpoint.
        // If not yet available, zones will just be empty and the UI degrades gracefully.
        setItems(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWarehouses();
  }, [refreshTrigger, internalRefresh]);

  // Columns for tanstack-table (used for show/hide only — rows rendered manually below)
  const columns: ColumnDef<WarehouseItem>[] = [
    { header: "Expand", accessorKey: "expand" },
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
            <div className="flex flex-wrap gap-4 items-center">
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-[#7047EB]" />
                  Warehouse
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  Zone / Area
                </span>
                <span className="flex items-center gap-1.5">
                  <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />
                  Rack / Bin
                </span>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="bg-[#7047EB] h-8 text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Warehouse
            </Button>
          </div>
        </section>

        {/* Table */}
        <div className="px-5">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border">
                <TableHead className="relative h-10 border-t border-r w-10 select-none" />
                <TableHead className="relative h-10 border-t border-r select-none">Name</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Address 1</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Address 2</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">City</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Postal Code</TableHead>
                <TableHead className="relative h-10 border-t border-r select-none">Actions</TableHead>
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableLoading columnLength={7} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-96 text-center">
                      <div className="w-full flex flex-col gap-3 justify-center items-center">
                        <img src="/folder.svg" alt="" />
                        <h4 className="font-bold text-lg">No Warehouse Added</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          Please add a warehouse to get started and manage your operations efficiently.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const warehouse = row.original;
                    return (
                      <WarehouseRow
                        key={warehouse.id}
                        warehouse={warehouse}
                        onWarehouseEdit={(w) => toggleEditWarehouseModal?.(w)}
                        onRefresh={triggerRefresh}
                      />
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
                <select
                  className="text-xs bg-neutral-100 shadow rounded-sm px-2 py-1 cursor-pointer"
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => table.setPageSize(Number(e.target.value))}
                >
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>{pageSize}</option>
                  ))}
                </select>
              </div>
              <button className="text-neutral-600" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>{"<<"}</button>
              <button className="text-neutral-600" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{"<"}</button>
              <button className="text-neutral-600" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{">"}</button>
              <button className="text-neutral-600" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>{">>"}</button>
            </div>
            <span className="text-xs text-neutral-600">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseMasterTable;
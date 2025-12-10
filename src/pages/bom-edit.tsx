// src/pages/production/bom-edit.tsx
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { bomAPI, BOMUpdateRequest } from "@/services/bomService";
import { routingAPI, type Routing } from "../services/routingService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Data Types (copied from create BOM)
interface Item {
  id: string;
  name: string;
  sku: string;
  unit?: {
    name: string;
    description: string;
    uom: string;
    id: number;
  };
  category?: {
    name: string;
    id: number;
    description: string;
  };
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

interface FinishedGood {
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

interface RawMaterial {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  comment: string;
  alternateItems: string;
  itemData?: Item;
}

interface ScrapItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  comment: string;
  itemData?: Item;
}

interface BOMRouting {
  routingId: number;
  routingName: string;
  routingNumber: string;
  comment: string;
}

interface OtherCharge {
  classification: string;
  account: string;
  amount: number;
  comment: string;
}

interface BOMLevelData {
  expanded: {
    bomSnapshot: boolean;
    finishedGoods: boolean;
    rawMaterials: boolean;
    routing: boolean;
    scrap: boolean;
    otherCharges: boolean;
  };
  finishedGoods: FinishedGood[];
  rawMaterials: RawMaterial[];
  routing: BOMRouting[];
  scrapItems: ScrapItem[];
  otherCharges: OtherCharge[];
}

// API Helper
import { get } from "@/lib/apiService";

// Warehouse API
const warehouseAPI = {
  getWarehouses: () => get("/inventory/warehouse"),
};

// Custom Select Component with Search (copied from create BOM)
const ItemSelect: React.FC<{
  value: string;
  onValueChange: (value: string, itemData?: Item) => void;
  items: Item[];
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onValueChange, items, placeholder = "Select item", disabled = false }) => {
  const [search, setSearch] = useState("");
  // const [isOpen, setIsOpen] = useState(false);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find(item => item.id === value);

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={(val) => {
          const item = items.find(i => i.id === val);
          onValueChange(val, item);
          // setIsOpen(false);
        }}
        // onOpenChange={setIsOpen}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder={placeholder}>
            {selectedItem ? (
              <div className="flex flex-col">
                <span className="font-medium">{selectedItem.name}</span>
                <span className="text-xs text-gray-500">SKU: {selectedItem.sku}</span>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              No items found
            </div>
          ) : (
            filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500">
                    SKU: {item.sku} | Category: {item.category?.name || "N/A"} | Stock: {item.currentStock}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

// Routing Dialog Component (copied from create BOM)
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
  const [newRouting, setNewRouting] = useState({
    number: "",
    name: "",
    desc: ""
  });
  const [creating, setCreating] = useState(false);

  const fetchRoutings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching routings...");

      const response = await routingAPI.getAllRoutings();
      console.log("Routing API response:", response);

      if (response?.status && Array.isArray(response.data)) {
        console.log("Routings loaded:", response.data.length);
        setRoutings(response.data);
        setHasFetched(true);
      } else {
        console.error("Invalid routing data format:", response);
        setError("Invalid routing data format received from server");
      }
    } catch (err) {
      console.error("Error fetching routings:", err);
      setError(`Error loading routings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !hasFetched) {
      fetchRoutings();
    }
    
    if (!open) {
      setSelectedRouting(null);
      setComment("");
      setShowNewForm(false);
      setNewRouting({ number: "", name: "", desc: "" });
    }
  }, [open, hasFetched]);

  const handleCreateRouting = async () => {
    if (!newRouting.number || !newRouting.name) {
      alert("Please fill in required fields");
      return;
    }

    try {
      setCreating(true);
      console.log("Creating new routing:", newRouting);

      const response = await routingAPI.createRouting(newRouting);
      console.log("Create routing response:", response);

      if (response?.status) {
        const newRoutingData = response.data;
        setRoutings((prev) => [...prev, newRoutingData]);
        setSelectedRouting(newRoutingData);
        setNewRouting({ number: "", name: "", desc: "" });
        setShowNewForm(false);
        
        toast.success("Routing created successfully!");
      } else {
        console.error("Failed to create routing:", response);
        toast.error("Failed to create routing. Please try again.");
      }
    } catch (err) {
      console.error("Error creating routing:", err);
      toast.error(`Error creating routing: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = () => {
    if (!selectedRouting) {
      toast.error("Please select a routing");
      return;
    }
    console.log("Selected routing:", selectedRouting, "with comment:", comment);
    onSelect(selectedRouting, comment);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && !hasFetched) {
        fetchRoutings();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Plus className="h-5 w-5 mr-2" /> Add Routing / Work Center
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Routing for Level {levelIndex + 1}</DialogTitle>
          <DialogDescription>
            Choose an existing routing or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {showNewForm ? (
            <div className="border rounded-lg p-6 bg-gray-50">
              <h3 className="font-semibold mb-4 text-lg">Create New Routing</h3>
              <div className="space-y-4">
                <div>
                  <Label>Routing Number *</Label>
                  <Input
                    value={newRouting.number}
                    onChange={(e) =>
                      setNewRouting({ ...newRouting, number: e.target.value })
                    }
                    placeholder="e.g., Routing #3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Routing Name *</Label>
                  <Input
                    value={newRouting.name}
                    onChange={(e) =>
                      setNewRouting({ ...newRouting, name: e.target.value })
                    }
                    placeholder="e.g., R3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newRouting.desc}
                    onChange={(e) =>
                      setNewRouting({ ...newRouting, desc: e.target.value })
                    }
                    placeholder="Description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateRouting}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Create Routing
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                setShowNewForm(true);
                setSelectedRouting(null);
              }}
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" /> Create New Routing
            </Button>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Existing Routings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRoutings}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                  title="Refresh routings"
                >
                  <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-gray-600">Loading routings...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="text-red-600 mb-2">{error}</div>
                <Button
                  onClick={fetchRoutings}
                  variant="outline"
                  className="mt-2"
                >
                  Retry Loading
                </Button>
              </div>
            ) : routings.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 mb-2">No routings found</div>
                <Button
                  onClick={() => setShowNewForm(true)}
                  variant="outline"
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create First Routing
                </Button>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {routings.map((routing) => (
                  <div
                    key={routing.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedRouting?.id === routing.id
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedRouting(routing);
                      setShowNewForm(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedRouting?.id === routing.id
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedRouting?.id === routing.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-900">{routing.number}</h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {routing.id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Name:</span>{" "}
                          {routing.name}
                        </p>
                        {routing.desc && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {routing.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedRouting && (
            <div className="space-y-2">
              <Label htmlFor="routing-comment">Comment for "{selectedRouting.number}"</Label>
              <Textarea
                id="routing-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments or notes about this routing..."
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSelect} 
              disabled={!selectedRouting}
              className="bg-[#105076] hover:bg-[#0d4566]"
            >
              {selectedRouting ? `Select "${selectedRouting.number}"` : 'Select Routing'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Scrap Table Row (copied from create BOM)
const ScrapTableRow: React.FC<{
  item: ScrapItem;
  index: number;
  onUpdate: (index: number, field: keyof ScrapItem, value: any, itemData?: Item) => void;
  onDelete: () => void;
  items: Item[];
}> = ({ item, index, onUpdate, onDelete, items }) => {
  return (
    <div className="grid grid-cols-9 border-b hover:bg-gray-50 transition-colors">
      <div className="px-4 py-3 text-gray-500 text-sm font-medium flex items-center justify-center">{index + 1}</div>
      <div className="px-4 py-3 flex items-center">
        <ItemSelect
          value={item.id}
          onValueChange={(value, itemData) => onUpdate(index, "id", value, itemData)}
          items={items}
          placeholder="Select item"
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          value={item.name} 
          onChange={(e) => onUpdate(index, "name", e.target.value)} 
          className="h-9 text-sm" 
          placeholder="Name"
          readOnly={!!item.itemData}
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          value={item.category} 
          onChange={(e) => onUpdate(index, "category", e.target.value)} 
          className="h-9 text-sm" 
          placeholder="Category"
          readOnly={!!item.itemData}
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          type="number" 
          value={item.quantity} 
          onChange={(e) => onUpdate(index, "quantity", Number(e.target.value) || 0)} 
          className="h-9 text-sm" 
          min="0"
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          value={item.unit} 
          onChange={(e) => onUpdate(index, "unit", e.target.value)} 
          className="h-9 text-sm" 
          placeholder="Unit"
          readOnly={!!item.itemData}
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          type="number" 
          value={item.costAllocation} 
          onChange={(e) => onUpdate(index, "costAllocation", Number(e.target.value) || 0)} 
          className="h-9 text-sm" 
          placeholder="%" 
          min="0" 
          max="100"
        />
      </div>
      <div className="px-4 py-3 flex items-center">
        <Input 
          value={item.comment} 
          onChange={(e) => onUpdate(index, "comment", e.target.value)} 
          className="h-9 text-sm" 
          placeholder="Comment" 
        />
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:bg-red-50">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
};

// BOM Level Component (copied from create BOM)
const BOMLevel: React.FC<{
  levelIndex: number;
  data: BOMLevelData;
  items: Item[];
  onUpdate: (updated: BOMLevelData) => void;
  onDelete?: () => void;
}> = ({ levelIndex, data, items, onUpdate, onDelete }) => {
  const toggleSection = (section: keyof BOMLevelData["expanded"]) => {
    onUpdate({
      ...data,
      expanded: { ...data.expanded, [section]: !data.expanded[section] },
    });
  };

  // Finished Goods
  const addFinishedGood = () => {
    onUpdate({
      ...data,
      finishedGoods: [
        ...data.finishedGoods,
        { itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" },
      ],
    });
  };

  const removeFinishedGood = (idx: number) => {
    if (data.finishedGoods.length > 1) {
      onUpdate({ ...data, finishedGoods: data.finishedGoods.filter((_, i) => i !== idx) });
    }
  };

  const updateFinishedGood = (idx: number, field: keyof FinishedGood, value: any, itemData?: Item) => {
    const updated = [...data.finishedGoods];
    
    if (field === "itemId" && itemData) {
      updated[idx] = {
        ...updated[idx],
        itemId: value,
        name: itemData.name,
        category: itemData.category?.name || "",
        unit: itemData.unit?.name || "",
        itemData: itemData
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    
    onUpdate({ ...data, finishedGoods: updated });
  };

  // Raw Materials
  const addRawMaterial = () => {
    onUpdate({
      ...data,
      rawMaterials: [
        ...data.rawMaterials,
        { itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" },
      ],
    });
  };

  const removeRawMaterial = (idx: number) => {
    if (data.rawMaterials.length > 1) {
      onUpdate({ ...data, rawMaterials: data.rawMaterials.filter((_, i) => i !== idx) });
    }
  };

  const updateRawMaterial = (idx: number, field: keyof RawMaterial, value: any, itemData?: Item) => {
    const updated = [...data.rawMaterials];
    
    if (field === "itemId" && itemData) {
      updated[idx] = {
        ...updated[idx],
        itemId: value,
        name: itemData.name,
        category: itemData.category?.name || "",
        unit: itemData.unit?.name || "",
        itemData: itemData
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    
    onUpdate({ ...data, rawMaterials: updated });
  };

  // Routing
  const addRouting = (routing: Routing, comment: string) => {
    onUpdate({
      ...data,
      routing: [
        ...data.routing,
        {
          routingId: routing.id,
          routingName: routing.name,
          routingNumber: routing.number,
          comment: comment
        }
      ]
    });
  };

  const removeRouting = (idx: number) => {
    onUpdate({ ...data, routing: data.routing.filter((_, i) => i !== idx) });
  };

  // Scrap Items
  const addScrapItem = () => {
    onUpdate({
      ...data,
      scrapItems: [
        ...data.scrapItems,
        { id: "", name: "", category: "", quantity: 0, unit: "", costAllocation: 0, comment: "" },
      ],
    });
  };

  const updateScrapItem = (idx: number, field: keyof ScrapItem, value: any, itemData?: Item) => {
    const updated = [...data.scrapItems];
    
    if (field === "id" && itemData) {
      updated[idx] = {
        ...updated[idx],
        id: value,
        name: itemData.name,
        category: itemData.category?.name || "",
        unit: itemData.unit?.name || "",
        itemData: itemData
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    
    onUpdate({ ...data, scrapItems: updated });
  };

  const removeScrapItem = (idx: number) => {
    onUpdate({ ...data, scrapItems: data.scrapItems.filter((_, i) => i !== idx) });
  };

  // Other Charges
  const updateOtherCharge = (idx: number, field: keyof OtherCharge, value: any) => {
    const updated = [...data.otherCharges];
    updated[idx] = { ...updated[idx], [field]: value };
    onUpdate({ ...data, otherCharges: updated });
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white mt-8 first:mt-0 shadow-sm">
      {/* Level Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#105076] text-white rounded-t-lg">
        <h2 className="text-xl font-bold">BOM Level {levelIndex + 1}</h2>
        {onDelete && (
          <Button variant="ghost" size="icon" onClick={onDelete} className="hover:bg-white/20">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* 1. BOM Snapshot */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggleSection("bomSnapshot")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <FileText className="h-5 w-5" /> BOM Summary
        </h3>
        {data.expanded.bomSnapshot ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.bomSnapshot && (
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-blue-600">{data.rawMaterials.filter(rm => rm.itemId).length}</div>
              <div className="text-sm text-blue-800 font-medium">RAW MATERIALS</div>
              <div className="text-xs text-blue-600 mt-1">
                {data.rawMaterials.filter(rm => rm.itemId).length > 0 
                  ? `${data.rawMaterials.filter(rm => rm.itemId).length} item(s)` 
                  : "No items added"}
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-green-600">{data.routing.length}</div>
              <div className="text-sm text-green-800 font-medium">ROUTING</div>
              <div className="text-xs text-green-600 mt-1">
                {data.routing.length > 0 
                  ? `${data.routing.length} step(s)` 
                  : "No routing added"}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-purple-600">{data.finishedGoods.filter(fg => fg.itemId).length}</div>
              <div className="text-sm text-purple-800 font-medium">FINISHED GOODS</div>
              <div className="text-xs text-purple-600 mt-1">
                {data.finishedGoods.filter(fg => fg.itemId).length > 0 
                  ? `${data.finishedGoods.filter(fg => fg.itemId).length} item(s)` 
                  : "No items added"}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-2xl font-bold text-orange-600">{data.scrapItems.filter(s => s.id).length}</div>
              <div className="text-sm text-orange-800 font-medium">SCRAP MATERIALS</div>
              <div className="text-xs text-orange-600 mt-1">
                {data.scrapItems.filter(s => s.id).length > 0 
                  ? `${data.scrapItems.filter(s => s.id).length} item(s)` 
                  : "No items added"}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Optional: Upload supporting documents</span>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" /> Upload Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Finished Goods */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggleSection("finishedGoods")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <Package className="h-5 w-5 text-green-600" /> Finished Goods
        </h3>
        {data.expanded.finishedGoods ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.finishedGoods && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Finished Goods List</h4>
            <Button size="sm" onClick={addFinishedGood}><Plus className="h-4 w-4 mr-2" /> Add Row</Button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="grid grid-cols-9 text-sm font-medium text-gray-600 bg-gray-100 border-b">
              <div className="px-3 py-3">#</div>
              <div className="px-3 py-3 col-span-2">Item</div>
              <div className="px-3 py-3">Category</div>
              <div className="px-3 py-3">Qty</div>
              <div className="px-3 py-3">Unit</div>
              <div className="px-3 py-3">Cost %</div>
              <div className="px-3 py-3">Comment</div>
              <div className="px-3 py-3">Alternate</div>
            </div>
            {data.finishedGoods.map((fg, i) => (
              <div key={i} className="grid grid-cols-9 border-b hover:bg-gray-50">
                <div className="px-3 py-3 text-gray-500 flex items-center justify-center">{i + 1}</div>
                <div className="px-3 py-3 col-span-2">
                  <ItemSelect
                    value={fg.itemId}
                    onValueChange={(value, itemData) => updateFinishedGood(i, "itemId", value, itemData)}
                    items={items}
                    placeholder="Select item"
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={fg.category} 
                    onChange={(e) => updateFinishedGood(i, "category", e.target.value)} 
                    className="h-9" 
                    placeholder="Category"
                    readOnly={!!fg.itemData}
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    type="number" 
                    value={fg.quantity} 
                    onChange={(e) => updateFinishedGood(i, "quantity", Number(e.target.value) || 0)} 
                    className="h-9" 
                    min="1"
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={fg.unit} 
                    onChange={(e) => updateFinishedGood(i, "unit", e.target.value)} 
                    className="h-9" 
                    placeholder="Unit"
                    readOnly={!!fg.itemData}
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    type="number" 
                    value={fg.costAllocation} 
                    onChange={(e) => updateFinishedGood(i, "costAllocation", Number(e.target.value) || 0)} 
                    className="h-9" 
                    placeholder="%"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={fg.comment} 
                    onChange={(e) => updateFinishedGood(i, "comment", e.target.value)} 
                    className="h-9" 
                    placeholder="Comment"
                  />
                </div>
                <div className="px-3 py-3 flex gap-1 items-center">
                  <Input 
                    value={fg.alternateItems} 
                    onChange={(e) => updateFinishedGood(i, "alternateItems", e.target.value)} 
                    className="h-9" 
                    placeholder="Alt items"
                  />
                  {data.finishedGoods.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeFinishedGood(i)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Raw Materials */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggleSection("rawMaterials")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <Package className="h-5 w-5 text-blue-600" /> Raw Materials
        </h3>
        {data.expanded.rawMaterials ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.rawMaterials && (
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Raw Materials Required</h4>
            <Button size="sm" onClick={addRawMaterial}><Plus className="h-4 w-4 mr-2" /> Add Row</Button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="grid grid-cols-8 text-sm font-medium text-gray-600 bg-gray-100 border-b">
              <div className="px-3 py-3">#</div>
              <div className="px-3 py-3 col-span-2">Item</div>
              <div className="px-3 py-3">Category</div>
              <div className="px-3 py-3">Qty</div>
              <div className="px-3 py-3">Unit</div>
              <div className="px-3 py-3">Comment</div>
              <div className="px-3 py-3">Alternate</div>
            </div>
            {data.rawMaterials.map((rm, i) => (
              <div key={i} className="grid grid-cols-8 border-b hover:bg-gray-50">
                <div className="px-3 py-3 text-gray-500 flex items-center justify-center">{i + 1}</div>
                <div className="px-3 py-3 col-span-2">
                  <ItemSelect
                    value={rm.itemId}
                    onValueChange={(value, itemData) => updateRawMaterial(i, "itemId", value, itemData)}
                    items={items}
                    placeholder="Select item"
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={rm.category} 
                    onChange={(e) => updateRawMaterial(i, "category", e.target.value)} 
                    className="h-9" 
                    placeholder="Category"
                    readOnly={!!rm.itemData}
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    type="number" 
                    value={rm.quantity} 
                    onChange={(e) => updateRawMaterial(i, "quantity", Number(e.target.value) || 0)} 
                    className="h-9" 
                    min="1"
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={rm.unit} 
                    onChange={(e) => updateRawMaterial(i, "unit", e.target.value)} 
                    className="h-9" 
                    placeholder="Unit"
                    readOnly={!!rm.itemData}
                  />
                </div>
                <div className="px-3 py-3 flex items-center">
                  <Input 
                    value={rm.comment} 
                    onChange={(e) => updateRawMaterial(i, "comment", e.target.value)} 
                    className="h-9" 
                    placeholder="Comment"
                  />
                </div>
                <div className="px-3 py-3 flex gap-1 items-center">
                  <Input 
                    value={rm.alternateItems} 
                    onChange={(e) => updateRawMaterial(i, "alternateItems", e.target.value)} 
                    className="h-9" 
                    placeholder="Alt items"
                  />
                  {data.rawMaterials.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeRawMaterial(i)} className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Routing */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggleSection("routing")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <GitBranch className="h-5 w-5 text-purple-600" /> Routing
        </h3>
        {data.expanded.routing ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.routing && (
        <div className="p-6 border-b bg-gray-50">
          <div className="mb-6">
            <RoutingDialog 
              onSelect={(routing, comment) => addRouting(routing, comment)}
              levelIndex={levelIndex}
            />
          </div>
          
          {data.routing.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="grid grid-cols-5 text-sm font-medium text-gray-600 bg-gray-100 border-b">
                <div className="px-3 py-3">#</div>
                <div className="px-3 py-3">Routing Number</div>
                <div className="px-3 py-3">Name</div>
                <div className="px-3 py-3">Comment</div>
                <div className="px-3 py-3">Actions</div>
              </div>
              {data.routing.map((route, i) => (
                <div key={i} className="grid grid-cols-5 border-b hover:bg-gray-50">
                  <div className="px-3 py-3 text-gray-500 flex items-center">{i + 1}</div>
                  <div className="px-3 py-3 flex items-center font-medium">{route.routingNumber}</div>
                  <div className="px-3 py-3 flex items-center">{route.routingName}</div>
                  <div className="px-3 py-3 flex items-center">
                    <Input 
                      value={route.comment} 
                      onChange={(e) => {
                        const updated = [...data.routing];
                        updated[i].comment = e.target.value;
                        onUpdate({...data, routing: updated});
                      }} 
                      className="h-9" 
                      placeholder="Add comment"
                    />
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeRouting(i)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Scrap / By-Products */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" onClick={() => toggleSection("scrap")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <Trash2 className="h-5 w-5 text-orange-600" /> Scrap / By-Products
        </h3>
        {data.expanded.scrap ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.scrap && (
        <div className="p-6 border-b bg-gray-50">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="grid grid-cols-9 text-sm font-semibold text-white" style={{ backgroundColor: "#105076" }}>
              <div className="px-4 py-3">#</div>
              <div className="px-4 py-3">Item</div>
              <div className="px-4 py-3">Name</div>
              <div className="px-4 py-3">Category</div>
              <div className="px-4 py-3">Quantity</div>
              <div className="px-4 py-3">Unit</div>
              <div className="px-4 py-3">Cost Allocation (%)</div>
              <div className="px-4 py-3">Comment</div>
              <div className="px-4 py-3">Actions</div>
            </div>

            {data.scrapItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No data available</div>
            ) : (
              data.scrapItems.map((item, i) => (
                <ScrapTableRow
                  key={i}
                  item={item}
                  index={i}
                  onUpdate={updateScrapItem}
                  onDelete={() => removeScrapItem(i)}
                  items={items}
                />
              ))
            )}
          </div>

          <div className="mt-4">
            <Button onClick={addScrapItem} className="bg-[#105076] hover:bg-[#0d4566]">
              <Plus className="h-4 w-4 mr-2" /> Add Scrap Row
            </Button>
          </div>
        </div>
      )}

      {/* 6. Other Charges */}
      <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" onClick={() => toggleSection("otherCharges")}>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
          <DollarSign className="h-5 w-5 text-teal-600" /> Other Charges
        </h3>
        {data.expanded.otherCharges ? <ChevronUp /> : <ChevronDown />}
      </div>
      {data.expanded.otherCharges && (
        <div className="p-6">
          <div className="space-y-3">
            {data.otherCharges.map((c, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg items-center">
                <div className="font-medium text-sm">{c.classification}</div>
                <div className="text-gray-600 text-sm">{c.account}</div>
                <Input type="number" value={c.amount} onChange={(e) => updateOtherCharge(i, "amount", Number(e.target.value) || 0)} className="h-10" />
                <Input value={c.comment} onChange={(e) => updateOtherCharge(i, "comment", e.target.value)} placeholder="Note..." className="h-10" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Edit BOM Page Component
const EditBOM: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDescription, setShowDescription] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [docName, setDocName] = useState("");
  // const [customer, setCustomer] = useState("");
  const [fgStore, setFgStore] = useState("");
  const [rmStore, setRmStore] = useState("");
  const [scrapStore, setScrapStore] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  
  // State for items from API
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  
  // State for warehouses from API
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [errorWarehouses, setErrorWarehouses] = useState<string | null>(null);

  const [levels, setLevels] = useState<BOMLevelData[]>([
    {
      expanded: {
        bomSnapshot: true,
        finishedGoods: true,
        rawMaterials: true,
        routing: true,
        scrap: true,
        otherCharges: true,
      },
      finishedGoods: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }],
      rawMaterials: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" }],
      routing: [],
      scrapItems: [],
      otherCharges: [
        { classification: "Labour Charges", account: "Mintage", amount: 0, comment: "" },
        { classification: "Machinery Charges", account: "Account", amount: 0, comment: "" },
        { classification: "Electricity Charges", account: "Account", amount: 0, comment: "" },
        { classification: "Other Charges", account: "Account", amount: 0, comment: "" },
      ],
    },
  ]);

  // Fetch items from API on component mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setErrorItems(null);
        
        const response = await bomAPI.getItems();
        
        if (response?.status && Array.isArray(response.data)) {
          const transformedItems: Item[] = response.data.map((item: any) => ({
            id: item.id?.toString() || "",
            name: item.name || "",
            sku: item.sku || "",
            unit: item.unit || undefined,
            category: item.category || undefined,
            currentStock: item.currentStock || "0",
            defaultPrice: item.defaultPrice || "0",
            hsnCode: item.hsnCode || "",
            minimumStockLevel: item.minimumStockLevel || "0",
            maximumStockLevel: item.maximumStockLevel || "0"
          }));
          
          setItems(transformedItems);
        } else {
          setErrorItems("Invalid API response format");
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setErrorItems("Failed to load items from server");
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch warehouses from API on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        setErrorWarehouses(null);
        
        const response = await warehouseAPI.getWarehouses();
        
        if (response?.status && Array.isArray(response.data)) {
          console.log("Warehouses loaded:", response.data);
          setWarehouses(response.data);
        } else {
          setErrorWarehouses("Invalid warehouse API response format");
          setWarehouses([]);
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        setErrorWarehouses("Failed to load warehouses from server");
        setWarehouses([]);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    fetchWarehouses();
  }, []);

  // Fetch existing BOM data for editing
  useEffect(() => {
    const fetchBOMData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await bomAPI.getBOM(parseInt(id));
        
        if (response.status && response.data) {
          const data = response.data;
          
          // Set basic document details
          setDocNumber(data.docNumber);
          setDocName(data.docName);
          setDocDate(data.docDate.split('T')[0]); // Format date for input
          setDescription(data.docDescription || "");
          setComments(data.docComment || "");
          setStatus(data.status.toLowerCase() === "published" ? "published" : "draft");
          setFgStore(data.fgStore?.id?.toString() || "");
          setRmStore(data.rmStore?.id?.toString() || "");
          setScrapStore(data.scrapStore?.id?.toString() || "");
          
          // Transform BOM items to match our component structure
          if (data.bomItems && data.bomItems.length > 0) {
            const transformedLevels: BOMLevelData[] = data.bomItems.map((bomItem: any) => {
              // Find item data for finished goods
              const fgItem = items.find(item => item.id === bomItem.finishedGoods?.item?.id?.toString());
              
              return {
                expanded: {
                  bomSnapshot: true,
                  finishedGoods: true,
                  rawMaterials: true,
                  routing: true,
                  scrap: true,
                  otherCharges: true,
                },
                finishedGoods: bomItem.finishedGoods ? [{
                  itemId: bomItem.finishedGoods.item?.id?.toString() || "",
                  name: bomItem.finishedGoods.item?.name || "",
                  category: bomItem.finishedGoods.item?.type || "",
                  quantity: bomItem.finishedGoods.quantity || 1,
                  unit: bomItem.finishedGoods.unit?.name || "",
                  costAllocation: bomItem.finishedGoods.costAlloc || 0,
                  comment: bomItem.finishedGoods.comment || "",
                  alternateItems: "",
                  itemData: fgItem
                }] : [],
                
                rawMaterials: bomItem.rawMaterials?.map((rm: any) => {
                  const rmItem = items.find(item => item.id === rm.item?.id?.toString());
                  return {
                    itemId: rm.item?.id?.toString() || "",
                    name: rm.item?.name || "",
                    category: rm.item?.type || "",
                    quantity: rm.quantity || 1,
                    unit: rm.unit?.name || "",
                    comment: rm.comment || "",
                    alternateItems: "",
                    itemData: rmItem
                  };
                }) || [],
                
                routing: bomItem.routing?.map((route: any) => ({
                  routingId: route.routing?.id || 0,
                  routingName: route.routing?.name || "",
                  routingNumber: route.routing?.number || "",
                  comment: route.comment || ""
                })) || [],
                
                scrapItems: bomItem.scrap?.map((scrap: any) => {
                  const scrapItem = items.find(item => item.id === scrap.item?.id?.toString());
                  return {
                    id: scrap.item?.id?.toString() || "",
                    name: scrap.item?.name || "",
                    category: scrap.item?.type || "",
                    quantity: scrap.quantity || 0,
                    unit: scrap.unit?.name || "",
                    costAllocation: scrap.costAlloc || 0,
                    comment: scrap.comment || "",
                    itemData: scrapItem
                  };
                }) || [],
                
                otherCharges: bomItem.otherCharges?.map((charge: any) => ({
                  classification: charge.classification || "",
                  account: "Account",
                  amount: charge.charges || 0,
                  comment: charge.comment || ""
                })) || [
                  { classification: "Labour Charges", account: "Mintage", amount: 0, comment: "" },
                  { classification: "Machinery Charges", account: "Account", amount: 0, comment: "" },
                  { classification: "Electricity Charges", account: "Account", amount: 0, comment: "" },
                  { classification: "Other Charges", account: "Account", amount: 0, comment: "" },
                ]
              };
            });
            
            setLevels(transformedLevels);
          }
        }
      } catch (error) {
        console.error("Error fetching BOM data:", error);
        toast.error("Failed to load BOM data for editing");
      } finally {
        setLoading(false);
      }
    };

    // Fetch BOM data after items and warehouses are loaded
    if (items.length > 0 || warehouses.length > 0) {
      fetchBOMData();
    }
  }, [id, items, warehouses]);

  const addNewLevel = () => {
    setLevels((prev) => [
      ...prev,
      {
        expanded: { bomSnapshot: true, finishedGoods: true, rawMaterials: true, routing: true, scrap: true, otherCharges: true },
        finishedGoods: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", costAllocation: 0, comment: "", alternateItems: "" }],
        rawMaterials: [{ itemId: "", name: "", category: "", quantity: 1, unit: "", comment: "", alternateItems: "" }],
        routing: [],
        scrapItems: [],
        otherCharges: [
          { classification: "Labour Charges", account: "Mintage", amount: 0, comment: "" },
          { classification: "Machinery Charges", account: "Account", amount: 0, comment: "" },
          { classification: "Electricity Charges", account: "Account", amount: 0, comment: "" },
          { classification: "Other Charges", account: "Account", amount: 0, comment: "" },
        ],
      },
    ]);
  };

  const deleteLevel = (index: number) => {
    if (levels.length === 1) {
      toast.error("Cannot delete the last BOM level");
      return;
    }
    setLevels((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLevel = (index: number, newData: BOMLevelData) => {
    setLevels((prev) => prev.map((lvl, i) => (i === index ? newData : lvl)));
  };

  // Prepare BOM data for API update
  const prepareUpdateData = (): BOMUpdateRequest => {
    const bomItems = levels.map(level => {
      // Finished Goods (take first item only)
      const fg = level.finishedGoods[0];
      const fgItem = items.find(item => item.id === fg.itemId);
      
      // Raw Materials
      const rawMaterials = level.rawMaterials.map(rm => {
        const rmItem = items.find(item => item.id === rm.itemId);
        return {
          itemId: parseInt(rm.itemId) || 0,
          unitId: rmItem?.unit?.id || rm.itemData?.unit?.id || 0,
          quantity: rm.quantity,
          costAlloc: 0,
          comment: rm.comment,
          hasAlternate: !!rm.alternateItems
        };
      });

      // Routing
      const routing = level.routing.map(route => ({
        routingId: route.routingId,
        comment: route.comment
      }));

      // Scrap items
      const scrap = level.scrapItems.map(scrap => {
        const scrapItem = items.find(item => item.id === scrap.id);
        return {
          itemId: parseInt(scrap.id) || 0,
          unitId: scrapItem?.unit?.id || scrap.itemData?.unit?.id || 0,
          quantity: scrap.quantity,
          costAlloc: scrap.costAllocation,
          comment: scrap.comment || undefined
        };
      });

      // Other Charges
      const otherCharges = level.otherCharges.map(charge => ({
        charges: charge.amount,
        classification: charge.classification,
        comment: charge.comment || undefined
      }));

      return {
        finishedGoods: {
          itemId: parseInt(fg.itemId) || 0,
          unitId: fgItem?.unit?.id || fg.itemData?.unit?.id || 0,
          quantity: fg.quantity,
          costAlloc: fg.costAllocation,
          comment: fg.comment,
          hasAlternate: !!fg.alternateItems
        },
        rawMaterials,
        routing,
        scrap,
        otherCharges
      };
    });

    return {
      docNumber,
      docDate: docDate || new Date().toISOString().split('T')[0],
      docName,
      docDescription: description || undefined,
      docComment: comments || undefined,
      status,
      fgStoreId: parseInt(fgStore) || 0,
      rmStoreId: parseInt(rmStore) || 0,
      scrapStoreId: parseInt(scrapStore) || 0,
      bomItems
    };
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!id) return;
    
    try {
      setSaving(true);
      const updateData = prepareUpdateData();
      updateData.status = "draft";
      
      console.log("Saving draft:", updateData);
      
      const response = await bomAPI.updateBOM(parseInt(id), updateData);
      
      if (response?.status) {
        console.log("BOM draft updated successfully:", response.data);
        toast.success("BOM saved as draft successfully!");
        navigate(`/production/bom/${id}`);
      } else {
        console.error("Failed to update BOM draft:", response);
        toast.error(response.message || "Failed to save BOM draft");
      }
    } catch (error) {
      console.error("Error updating BOM draft:", error);
      toast.error("Error saving BOM draft");
    } finally {
      setSaving(false);
    }
  };

  // Handle save/publish BOM
  const handleSaveBOM = async () => {
    if (!id) return;
    
    // Validate required fields
    if (!docName.trim()) {
      toast.error("Please enter a BOM name");
      return;
    }

    // Validate each level
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      // Validate finished goods
      for (let j = 0; j < level.finishedGoods.length; j++) {
        const fg = level.finishedGoods[j];
        if (!fg.itemId) {
          toast.error(`Level ${i + 1}: Please select an item for Finished Goods row ${j + 1}`);
          return;
        }
        if (fg.quantity <= 0) {
          toast.error(`Level ${i + 1}: Please enter a valid quantity for Finished Goods row ${j + 1}`);
          return;
        }
      }

      // Validate raw materials
      for (let j = 0; j < level.rawMaterials.length; j++) {
        const rm = level.rawMaterials[j];
        if (!rm.itemId) {
          toast.error(`Level ${i + 1}: Please select an item for Raw Materials row ${j + 1}`);
          return;
        }
        if (rm.quantity <= 0) {
          toast.error(`Level ${i + 1}: Please enter a valid quantity for Raw Materials row ${j + 1}`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      const updateData = prepareUpdateData();
      updateData.status = "published";
      
      console.log("Updating BOM:", updateData);
      
      const response = await bomAPI.updateBOM(parseInt(id), updateData);
      
      if (response?.status) {
        console.log("BOM updated successfully:", response.data);
        toast.success("BOM updated successfully!");
        navigate(`/production/bom/${id}`);
      } else {
        console.error("Failed to update BOM:", response);
        toast.error(response.message || "Failed to update BOM");
      }
    } catch (error) {
      console.error("Error updating BOM:", error);
      toast.error("Error updating BOM");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading BOM data for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-8xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" onClick={() => navigate(`/production/bom/${id}`)} className="h-10 w-10 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#105076]">Edit Bill of Material</h2>
            <p className="text-sm text-gray-500 mt-1">Editing: {docNumber}</p>
          </div>
        </div>
        <div className="text-sm bg-gray-100 px-3 py-1 rounded inline-block">
          Document: <span className="font-bold">{docNumber}</span>
        </div>
      </div>

      {/* Items Loading/Error State */}
      {loadingItems && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-blue-700">Loading items from inventory...</span>
        </div>
      )}
      
      {errorItems && !loadingItems && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <span className="text-yellow-700">{errorItems}</span>
        </div>
      )}

      {/* Warehouses Loading/Error State */}
      {loadingWarehouses && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          <span className="text-blue-700">Loading warehouses...</span>
        </div>
      )}
      
      {errorWarehouses && !loadingWarehouses && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
          <span className="text-yellow-700">{errorWarehouses}</span>
        </div>
      )}

      {/* Document Details */}
      <div className="border rounded-lg p-6 bg-white mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-[#105076]">Document Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="space-y-2">
            <Label>Document Number</Label>
            <Input value={docNumber} readOnly className="h-11 bg-gray-100" />
          </div>
          <div className="space-y-2">
            <Label>BOM Name <span className="text-red-500">*</span></Label>
            <Input 
              value={docName} 
              onChange={(e) => setDocName(e.target.value)} 
              placeholder="Enter BOM name" 
              className="h-11" 
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Document Date</Label>
            <Input 
              type="date" 
              value={docDate} 
              onChange={(e) => setDocDate(e.target.value)} 
              className="h-11" 
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: "draft" | "published") => setStatus(value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>FG Store <span className="text-red-500">*</span></Label>
            <Select value={fgStore} onValueChange={setFgStore}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select FG Store">
                  {warehouses.find(w => w.id.toString() === fgStore)?.name || "Select FG Store"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingWarehouses ? (
                  <div className="py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading warehouses...</p>
                  </div>
                ) : errorWarehouses ? (
                  <div className="py-4 text-center text-red-500 text-sm">
                    Error loading warehouses
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    No warehouses found
                  </div>
                ) : (
                  warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} (ID: {warehouse.id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>RM Store <span className="text-red-500">*</span></Label>
            <Select value={rmStore} onValueChange={setRmStore}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select RM Store">
                  {warehouses.find(w => w.id.toString() === rmStore)?.name || "Select RM Store"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingWarehouses ? (
                  <div className="py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading warehouses...</p>
                  </div>
                ) : errorWarehouses ? (
                  <div className="py-4 text-center text-red-500 text-sm">
                    Error loading warehouses
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    No warehouses found
                  </div>
                ) : (
                  warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} (ID: {warehouse.id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scrap/Reject Store <span className="text-red-500">*</span></Label>
            <Select value={scrapStore} onValueChange={setScrapStore}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select Scrap Store">
                  {warehouses.find(w => w.id.toString() === scrapStore)?.name || "Select Scrap Store"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {loadingWarehouses ? (
                  <div className="py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading warehouses...</p>
                  </div>
                ) : errorWarehouses ? (
                  <div className="py-4 text-center text-red-500 text-sm">
                    Error loading warehouses
                  </div>
                ) : warehouses.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    No warehouses found
                  </div>
                ) : (
                  warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} (ID: {warehouse.id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Attachments</Label>
            <Button variant="outline" className="w-full h-11 border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Attachments
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Description</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowDescription(!showDescription)}>
                <FileText className="h-4 w-4 mr-1" />
                {showDescription ? "Hide" : showDescription || description ? "Edit" : "Add"} Description
              </Button>
            </div>
            {(showDescription || description) && (
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Enter BOM description..." 
                className="min-h-24" 
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Internal Comments</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="h-4 w-4 mr-1" />
                {showComments ? "Hide" : showComments || comments ? "Edit" : "Add"} Comments
              </Button>
            </div>
            {(showComments || comments) && (
              <Textarea 
                value={comments} 
                onChange={(e) => setComments(e.target.value)} 
                placeholder="Add internal notes..." 
                className="min-h-24" 
              />
            )}
          </div>
        </div>
        <div className="mt-6 pt-4 border-t text-xs text-gray-500">
          Last Modified: <span className="font-medium">{new Date().toLocaleDateString('en-GB')} - {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {/* All BOM Levels */}
      {levels.map((levelData, idx) => (
        <BOMLevel
          key={idx}
          levelIndex={idx}
          data={levelData}
          items={items}
          onUpdate={(updated) => updateLevel(idx, updated)}
          onDelete={idx > 0 ? () => deleteLevel(idx) : undefined}
        />
      ))}

      {/* Add New Level */}
      <div className="flex justify-center py-8">
        <Button onClick={addNewLevel} size="lg" className="bg-[#105076] hover:bg-[#0d4566] text-white">
          <Plus className="h-6 w-6 mr-2" /> Add New BOM Level
        </Button>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 border-t bg-white shadow-lg mt-8">
        <div className="max-w-8xl mx-auto px-6 py-4 flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={handleSaveDraft} 
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save as Draft
          </Button>
          <Button 
            onClick={handleSaveBOM} 
            className="bg-[#105076] hover:bg-[#0d4566]" 
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Update BOM
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditBOM;
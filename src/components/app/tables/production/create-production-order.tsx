// src/components/app/tables/production/create-production-order.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// API Helper and Services
import { get } from "@/lib/apiService";
import { productionAPI } from "@/services/productionService";

// -------------------- TYPES --------------------
interface Item {
  id: number;
  sku: string;
  name: string;
  currentStock: string;
  unit?: {
    name: string;
  };
}

interface Warehouse {
  id: number;
  name: string;
}

interface BOMItem {
  id: number;
  docNumber: string;
  docName: string;
  status: string;
}

interface ProductionOrderItem {
  itemId: string;
  itemName: string;
  documentSeries: string;
  bom: string;
  currentStock: string;
  quantity: string;
  uom: string;
  referenceNumber: string;
  fgStore: string;
  rmStore: string;
  scrapStore: string;
  useSameStore: boolean;
  orderDeliveryDate: string;
  expectedProcessCompletionDate: string;
}

// -------------------- APIS --------------------
const inventoryAPI = {
  getItems: () => get("/inventory/item"),
};

const warehouseAPI = {
  getWarehouses: () => get("/inventory/warehouse"),
};

const bomAPI = {
  getBOMs: () => get("/production/bom"),
};

// -------------------- COMPONENT --------------------
const CreateProductionOrder: React.FC = () => {
  const navigate = useNavigate();

  // LOADING STATES
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [loadingBOMs, setLoadingBOMs] = useState(false);
  const [creatingProcess, setCreatingProcess] = useState(false);
  
  // DATA STATES
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [boms, setBoms] = useState<BOMItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBomQuery, setSearchBomQuery] = useState("");

  // PRODUCTION ITEMS
  const [productionItems, setProductionItems] = useState<ProductionOrderItem[]>([
    {
      itemId: "",
      itemName: "",
      documentSeries: "",
      bom: "",
      currentStock: "",
      quantity: "",
      uom: "",
      referenceNumber: "",
      fgStore: "",
      rmStore: "",
      scrapStore: "",
      useSameStore: false,
      orderDeliveryDate: "",
      expectedProcessCompletionDate: "",
    },
  ]);

  // -------------------- FETCH ITEMS --------------------
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoadingItems(true);
        const response = await inventoryAPI.getItems();

        if (response?.status && Array.isArray(response.data)) {
          setItems(response.data);
        } else {
          setErrorItems(response?.message || "Unable to load items");
        }
      } catch {
        setErrorItems("Network error");
      } finally {
        setLoadingItems(false);
      }
    };

    loadItems();
  }, []);

  // -------------------- FETCH WAREHOUSES --------------------
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const response = await warehouseAPI.getWarehouses();

        if (response?.status && Array.isArray(response.data)) {
          setWarehouses(response.data);
        }
      } catch (err) {
        console.log("Warehouse Error:", err);
        toast.error("Failed to load warehouses");
      } finally {
        setLoadingWarehouses(false);
      }
    };

    loadWarehouses();
  }, []);

  // -------------------- FETCH BOMS --------------------
  useEffect(() => {
    const loadBOMs = async () => {
      try {
        setLoadingBOMs(true);
        const response = await bomAPI.getBOMs();

        if (response?.status && Array.isArray(response.data)) {
          setBoms(response.data);
        }
      } catch (err) {
        console.log("BOM Error:", err);
        toast.error("Failed to load BOMs");
      } finally {
        setLoadingBOMs(false);
      }
    };

    loadBOMs();
  }, []);

  // -------------------- FILTER ITEMS --------------------
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------------------- FILTER BOMS --------------------
  const filteredBoms = boms.filter(
    (bom) =>
      bom.docNumber.toLowerCase().includes(searchBomQuery.toLowerCase()) ||
      bom.docName.toLowerCase().includes(searchBomQuery.toLowerCase())
  );

  // -------------------- ADD ROW --------------------
  const addItemRow = () => {
    setProductionItems([
      ...productionItems,
      {
        itemId: "",
        itemName: "",
        documentSeries: "",
        bom: "",
        currentStock: "",
        quantity: "",
        uom: "",
        referenceNumber: "",
        fgStore: "",
        rmStore: "",
        scrapStore: "",
        useSameStore: false,
        orderDeliveryDate: "",
        expectedProcessCompletionDate: "",
      },
    ]);
  };

  // -------------------- REMOVE ROW --------------------
  const removeItemRow = (index: number) => {
    if (productionItems.length === 1) return;
    const updated = [...productionItems];
    updated.splice(index, 1);
    setProductionItems(updated);
  };

  // -------------------- SELECT ITEM --------------------
  const handleItemSelect = (index: number, itemId: string) => {
    const selected = items.find((i) => i.id.toString() === itemId);
    if (!selected) return;

    const updated = [...productionItems];
    updated[index] = {
      ...updated[index],
      itemId,
      itemName: selected.name,
      currentStock: selected.currentStock,
      uom: selected.unit?.name || "",
    };

    setProductionItems(updated);
  };

  // -------------------- UPDATE FIELD --------------------
  const updateItemField = (
    index: number,
    field: keyof ProductionOrderItem,
    value: any
  ) => {
    const updated = [...productionItems];

    // same store logic
    if (field === "useSameStore" && value === true) {
      const storeValue =
        updated[index].fgStore ||
        updated[index].rmStore ||
        updated[index].scrapStore ||
        "";

      updated[index] = {
        ...updated[index],
        [field]: value,
        fgStore: storeValue,
        rmStore: storeValue,
        scrapStore: storeValue,
      };
    } else {
      (updated[index] as any)[field] = value;

      if (
        updated[index].useSameStore &&
        ["fgStore", "rmStore", "scrapStore"].includes(field)
      ) {
        updated[index].fgStore = value;
        updated[index].rmStore = value;
        updated[index].scrapStore = value;
      }
    }

    setProductionItems(updated);
  };

  // Get warehouse ID by name
  const getWarehouseIdByName = (warehouseName: string): number | undefined => {
    const warehouse = warehouses.find(w => w.name === warehouseName);
    return warehouse?.id;
  };

  // -------------------- CREATE PRODUCTION PROCESS --------------------
  const handleCreateProduction = async () => {
    // Validate required fields
    const invalidItems = productionItems.some(
      (item) => !item.itemId || !item.quantity || !item.bom
    );

    if (invalidItems) {
      toast.error("Please fill all required fields (Item, Quantity, and BOM) for all rows");
      return;
    }

    try {
      setCreatingProcess(true);

      // Create production process for each item
      const createdProcesses: Array<{
        processId: number;
        docNumber: string;
        itemName: string;
      }> = [];
      
      for (const item of productionItems) {
        if (!item.itemId || !item.quantity || !item.bom) {
          continue;
        }

        // Get BOM ID from the selected BOM string (format: "ID: 123 - BOM0001")
        const bomMatch = item.bom.match(/ID:\s*(\d+)/);
        const bomId = bomMatch ? parseInt(bomMatch[1]) : parseInt(item.bom);

        if (isNaN(bomId)) {
          throw new Error(`Invalid BOM ID for item: ${item.itemName}`);
        }

        // Get warehouse IDs
        const fgWarehouseId = getWarehouseIdByName(item.fgStore);
        const rmWarehouseId = getWarehouseIdByName(item.rmStore);
        const scrapWarehouseId = getWarehouseIdByName(item.scrapStore);

        // Prepare the payload with only the required and allowed fields
        const payload: any = {
          bomId: bomId,
          quantity: parseFloat(item.quantity) || 1,
        };

        // Add optional fields if they exist - using field names as you specified
        if (rmWarehouseId) {
          payload.rmStore = rmWarehouseId;
        }
        
        if (fgWarehouseId) {
          payload.fgStore = fgWarehouseId;
        }
        
        if (scrapWarehouseId) {
          payload.scrapStore = scrapWarehouseId;
        }
        
        if (item.orderDeliveryDate) {
          payload.orderDeliveryDate = item.orderDeliveryDate;
        }
        
        if (item.expectedProcessCompletionDate) {
          payload.expectedCompletionDate = item.expectedProcessCompletionDate;
        }

        // Create production process from BOM with the payload
        const createResponse = await productionAPI.createProductionFromBOM(payload as any);

        if (!createResponse.status) {
          throw new Error(createResponse.message || `Failed to create process for ${item.itemName}`);
        }

        createdProcesses.push({
          processId: createResponse.data.id,
          docNumber: createResponse.data.docNumber,
          itemName: item.itemName
        });

        // Show success message for each created process
        toast.success(`Created process ${createResponse.data.docNumber} for ${item.itemName}`);
      }

      if (createdProcesses.length > 0) {
        toast.success(`Successfully created ${createdProcesses.length} production process(es)`);
        
        // Navigate to the first created process
        if (createdProcesses[0]) {
          setTimeout(() => {
            navigate(`/production/process-details?processId=${createdProcesses[0].processId}`);
          }, 1000);
        } else {
          navigate("/production");
        }
      } else {
        toast.error("No production processes were created");
      }

    } catch (error: any) {
      console.error("Error creating production process:", error);
      toast.error(error.message || "Failed to create production process");
    } finally {
      setCreatingProcess(false);
    }
  };

  // -------------------- GENERATE ORDER NUMBER --------------------
  const generateOrderNumber = () => {
    const timestamp = new Date().getTime();
    return `PO${timestamp.toString().slice(-6)}`;
  };

  // -------------------- ITEM SELECT DROPDOWN --------------------
  const ItemSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    const selected = items.find((i) => i.id.toString() === value);

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select Item">
            {selected ? selected.name : "Select Item"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 h-8"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {loadingItems ? (
            <div className="text-center py-3">
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center py-4 text-sm">No items found</p>
          ) : (
            filteredItems.map((item) => (
              <SelectItem key={item.id} value={item.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500">SKU: {item.sku}</span>
                  <span className="text-xs text-gray-500">Stock: {item.currentStock} {item.unit?.name || ''}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  // -------------------- BOM SELECT DROPDOWN --------------------
  const BOMSelect = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select BOM" />
        </SelectTrigger>

        <SelectContent>
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 h-8"
                placeholder="Search BOM..."
                value={searchBomQuery}
                onChange={(e) => setSearchBomQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {loadingBOMs ? (
            <div className="text-center py-3">
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            </div>
          ) : filteredBoms.length === 0 ? (
            <p className="text-center py-4 text-sm">No BOMs found</p>
          ) : (
            filteredBoms.map((bom) => (
              <SelectItem key={bom.id} value={`ID: ${bom.id} - ${bom.docNumber}`}>
                <div className="flex flex-col">
                  <span className="font-medium">{bom.docNumber}</span>
                  <span className="text-xs text-gray-500">{bom.docName}</span>
                  <span className={`text-xs ${bom.status === 'published' ? 'text-green-600' : 'text-yellow-600'}`}>
                    Status: {bom.status}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  // -------------------- UI --------------------
  return (
    <div className="p-6 max-w-8xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[#105076]">
            Create Production Order
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create production processes from BOMs for selected items
          </p>
        </div>
      </div>

      {/* VALIDATION MESSAGE */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Required Fields: Item, Quantity, and BOM
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Each production process will be created from the selected BOM with the specified quantity.
            </p>
          </div>
        </div>
      </div>

      {/* ADD ROW BUTTON */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={addItemRow}
          className="bg-[#105076] hover:bg-[#0d4566] text-white"
          disabled={creatingProcess}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Row
        </Button>
      </div>

      {/* TABLE WITH HORIZONTAL SCROLL */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap">#</TableHead>
                <TableHead className="whitespace-nowrap min-w-[200px]">Item *</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Item Name</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Document Series</TableHead>
                <TableHead className="whitespace-nowrap min-w-[200px]">BOM *</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Stock</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Qty *</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">UOM</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Reference Number</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">FG Store</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">RM Store</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Scrap Store</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Same Store</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Delivery Date</TableHead>
                <TableHead className="whitespace-nowrap min-w-[180px]">Expected Completion</TableHead>
                <TableHead className="whitespace-nowrap min-w-[80px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {productionItems.map((row, index) => (
                <TableRow key={index} className="whitespace-nowrap">
                  {/* Index */}
                  <TableCell>{index + 1}</TableCell>

                  {/* Item Dropdown */}
                  <TableCell>
                    <ItemSelect
                      value={row.itemId}
                      onChange={(v) => handleItemSelect(index, v)}
                    />
                  </TableCell>

                  {/* Item Name */}
                  <TableCell>
                    <Input value={row.itemName} readOnly className="min-w-[150px]" />
                  </TableCell>

                  {/* Document Series */}
                  <TableCell>
                    <Input
                      placeholder="Series"
                      value={row.documentSeries}
                      onChange={(e) =>
                        updateItemField(index, "documentSeries", e.target.value)
                      }
                      className="min-w-[150px]"
                    />
                  </TableCell>

                  {/* BOM Dropdown */}
                  <TableCell>
                    <BOMSelect
                      value={row.bom}
                      onChange={(v) => updateItemField(index, "bom", v)}
                    />
                  </TableCell>

                  {/* Stock */}
                  <TableCell>
                    <Input value={row.currentStock} readOnly className="min-w-[100px]" />
                  </TableCell>

                  {/* Qty */}
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItemField(index, "quantity", e.target.value)
                      }
                      className="min-w-[100px]"
                      placeholder="0"
                    />
                  </TableCell>

                  {/* UOM */}
                  <TableCell>
                    <Input value={row.uom} readOnly className="min-w-[100px]" />
                  </TableCell>

                  {/* Reference Number */}
                  <TableCell>
                    <Input
                      value={row.referenceNumber}
                      placeholder="Reference Number"
                      onChange={(e) =>
                        updateItemField(index, "referenceNumber", e.target.value)
                      }
                      className="min-w-[150px]"
                    />
                  </TableCell>

                  {/* FG Store */}
                  <TableCell>
                    <Select
                      value={row.fgStore}
                      disabled={row.useSameStore || creatingProcess}
                      onValueChange={(v) => updateItemField(index, "fgStore", v)}
                    >
                      <SelectTrigger className="min-w-[150px]">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* RM Store */}
                  <TableCell>
                    <Select
                      value={row.rmStore}
                      disabled={row.useSameStore || creatingProcess}
                      onValueChange={(v) => updateItemField(index, "rmStore", v)}
                    >
                      <SelectTrigger className="min-w-[150px]">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Scrap Store */}
                  <TableCell>
                    <Select
                      value={row.scrapStore}
                      disabled={row.useSameStore || creatingProcess}
                      onValueChange={(v) =>
                        updateItemField(index, "scrapStore", v)
                      }
                    >
                      <SelectTrigger className="min-w-[150px]">
                        <SelectValue placeholder="Select Store" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.name}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Same Store */}
                  <TableCell>
                    <Checkbox
                      checked={row.useSameStore}
                      onCheckedChange={(c) =>
                        updateItemField(index, "useSameStore", c)
                      }
                      className="ml-2"
                      disabled={creatingProcess}
                    />
                  </TableCell>

                  {/* Delivery Date */}
                  <TableCell>
                    <Input
                      type="date"
                      value={row.orderDeliveryDate}
                      onChange={(e) =>
                        updateItemField(
                          index,
                          "orderDeliveryDate",
                          e.target.value
                        )
                      }
                      className="min-w-[150px]"
                      disabled={creatingProcess}
                    />
                  </TableCell>

                  {/* Expected Completion */}
                  <TableCell>
                    <Input
                      type="date"
                      value={row.expectedProcessCompletionDate}
                      onChange={(e) =>
                        updateItemField(
                          index,
                          "expectedProcessCompletionDate",
                          e.target.value
                        )
                      }
                      className="min-w-[180px]"
                      disabled={creatingProcess}
                    />
                  </TableCell>

                  {/* Delete */}
                  <TableCell>
                    {productionItems.length > 1 && !creatingProcess && (
                      <Button
                        variant="ghost"
                        onClick={() => removeItemRow(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-700">Summary</h3>
            <p className="text-sm text-gray-600">
              {productionItems.length} item(s) selected for production
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Required Fields:</span> Item, Quantity, BOM
          </div>
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-4 mt-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          disabled={creatingProcess}
        >
          Cancel
        </Button>
        <Button
          className="bg-[#105076] hover:bg-[#0d4566]"
          onClick={handleCreateProduction}
          disabled={creatingProcess || productionItems.length === 0}
        >
          {creatingProcess ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Production Process'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateProductionOrder;
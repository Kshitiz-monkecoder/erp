// src/components/app/tables/production/create-production-order.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Search,
  Loader2,
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

// Work Order Types from API
interface Buyer {
  id: number;
  name: string;
  email: string;
  clientType: string;
  companyName: string;
  companyEmail: string;
}

interface OrderItemDetail {
  item?: {
    id: number;
    sku: string;
    name: string;
    currentStock: string;
    unit?: {
      name: string;
    };
  };
  hsn: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  tax: string;
  id: number;
}

interface WorkOrderData {
  id: number;
  documentNumber: string;
  buyer: Buyer;
  items: OrderItemDetail[];
  warehouse: Warehouse;
  deliveryDate: string;
  documentDate: string;
  poNumber: string;
  paymentType: string;
  status: string;
}

interface LocationState {
  workOrderData?: WorkOrderData;
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
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const workOrderData = locationState?.workOrderData;

  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingBOMs, setLoadingBOMs] = useState(false);
  const [creatingProcess, setCreatingProcess] = useState(false);
  
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [boms, setBoms] = useState<BOMItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBomQuery, setSearchBomQuery] = useState("");

  const [rowBoms, setRowBoms] = useState<Record<number, BOMItem[]>>({});
  const [rowLoadingBOMs, setRowLoadingBOMs] = useState<Record<number, boolean>>({});
  const [rowBomsLoaded, setRowBomsLoaded] = useState<Record<number, boolean>>({});

  // Only 1 row — no add row button
  const [productionItems, setProductionItems] = useState<ProductionOrderItem[]>(() => {
    if (workOrderData?.items && workOrderData.items.length > 0) {
      return workOrderData.items.map((orderItem) => ({
        itemId: orderItem.item?.id?.toString() || "",
        itemName: orderItem.item?.name || "",
        documentSeries: workOrderData.documentNumber || "",
        bom: "",
        currentStock: orderItem.item?.currentStock || "",
        quantity: orderItem.quantity || "",
        uom: orderItem.item?.unit?.name || "",
        referenceNumber: workOrderData.documentNumber || "",
        fgStore: workOrderData.warehouse?.name || "",
        rmStore: workOrderData.warehouse?.name || "",
        scrapStore: workOrderData.warehouse?.name || "",
        useSameStore: true,
        orderDeliveryDate: workOrderData.deliveryDate || "",
        expectedProcessCompletionDate: workOrderData.deliveryDate || "",
      }));
    } else {
      return [{
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
      }];
    }
  });

  useEffect(() => {
    if (workOrderData) {
      document.title = `Create Production Order - ${workOrderData.documentNumber}`;
    }
  }, [workOrderData]);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoadingItems(true);
        const response = await inventoryAPI.getItems();

        if (response?.status && Array.isArray(response.data)) {
          setItems(response.data);
          
          if (workOrderData?.items && productionItems.length > 0) {
            const updatedItems = [...productionItems];
            
            workOrderData.items.forEach((orderItem, index) => {
              if (orderItem.item) {
                const foundItem = response.data.find((item: Item) => item.id === orderItem.item?.id);
                if (foundItem) {
                  updatedItems[index] = {
                    ...updatedItems[index],
                    itemId: foundItem.id.toString(),
                    itemName: foundItem.name,
                    currentStock: foundItem.currentStock,
                    uom: foundItem.unit?.name || "",
                  };
                  fetchBOMsForItem(foundItem.id, index);
                }
              }
            });
            
            setProductionItems(updatedItems);
          }
        }
      } catch (error) {
        console.error("Error loading items:", error);
        toast.error("Failed to load items");
      } finally {
        setLoadingItems(false);
      }
    };

    loadItems();
  }, [workOrderData]);

  const fetchBOMsForItem = async (itemId: number, rowIndex: number) => {
    try {
      setRowLoadingBOMs(prev => ({ ...prev, [rowIndex]: true }));
      const response = await productionAPI.getBOMByFinishedGoodItem(itemId);

      if (response?.status && Array.isArray(response.data)) {
        setRowBoms(prev => ({
          ...prev,
          [rowIndex]: response.data,
        }));
      } else {
        setRowBoms(prev => ({ ...prev, [rowIndex]: [] }));
      }
    } catch (err) {
      console.error("Error fetching BOMs for item:", err);
      setRowBoms(prev => ({ ...prev, [rowIndex]: [] }));
    } finally {
      setRowLoadingBOMs(prev => ({ ...prev, [rowIndex]: false }));
      setRowBomsLoaded(prev => ({ ...prev, [rowIndex]: true }));
    }
  };

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const response = await warehouseAPI.getWarehouses();

        if (response?.status && Array.isArray(response.data)) {
          setWarehouses(response.data);
        }
      } catch (err) {
        console.log("Warehouse Error:", err);
        toast.error("Failed to load warehouses");
      }
    };

    loadWarehouses();
  }, []);

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

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBoms = boms.filter(
    (bom) =>
      bom.docNumber.toLowerCase().includes(searchBomQuery.toLowerCase()) ||
      bom.docName.toLowerCase().includes(searchBomQuery.toLowerCase())
  );

  const handleItemSelect = async (index: number, itemId: string) => {
    const selected = items.find((i) => i.id.toString() === itemId);
    if (!selected) return;

    const updated = [...productionItems];
    updated[index] = {
      ...updated[index],
      itemId,
      itemName: selected.name,
      currentStock: selected.currentStock,
      uom: selected.unit?.name || "",
      bom: "",
    };

    setProductionItems(updated);
    setRowBomsLoaded(prev => ({ ...prev, [index]: false }));
    await fetchBOMsForItem(selected.id, index);
  };

  const updateItemField = (
    index: number,
    field: keyof ProductionOrderItem,
    value: any
  ) => {
    const updated = [...productionItems];

    if (field === "quantity") {
      const qty = parseFloat(value) || 0;
      const stock = parseFloat(updated[index].currentStock) || 0;

      if (qty > stock) {
        toast.error(`Quantity (${qty}) cannot exceed available stock (${stock})`);
        return; // do not update
      }
    }

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

  const getWarehouseIdByName = (warehouseName: string): number | undefined => {
    const warehouse = warehouses.find(w => w.name === warehouseName);
    return warehouse?.id;
  };

  const handleCreateProduction = async () => {
    const invalidItems = productionItems.some(
      (item) => !item.itemId || !item.quantity || !item.bom
    );

    if (invalidItems) {
      toast.error("Please fill all required fields (Item, Quantity, and BOM)");
      return;
    }

    try {
      setCreatingProcess(true);

      const createdProcesses: Array<{
        processId: number;
        docNumber: string;
        itemName: string;
      }> = [];
      
      for (const item of productionItems) {
        if (!item.itemId || !item.quantity || !item.bom) {
          continue;
        }

        const bomMatch = item.bom.match(/ID:\s*(\d+)/);
        const bomId = bomMatch ? parseInt(bomMatch[1]) : parseInt(item.bom);

        if (isNaN(bomId)) {
          throw new Error(`Invalid BOM ID for item: ${item.itemName}`);
        }

        const fgWarehouseId = getWarehouseIdByName(item.fgStore);
        const rmWarehouseId = getWarehouseIdByName(item.rmStore);
        const scrapWarehouseId = getWarehouseIdByName(item.scrapStore);

        const payload: any = {
          bomId: bomId,
          quantity: parseFloat(item.quantity) || 1,
        };

        if (rmWarehouseId) payload.rmStore = rmWarehouseId;
        if (fgWarehouseId) payload.fgStore = fgWarehouseId;
        if (scrapWarehouseId) payload.scrapStore = scrapWarehouseId;
        if (item.orderDeliveryDate) payload.orderDeliveryDate = item.orderDeliveryDate;
        if (item.expectedProcessCompletionDate) payload.expectedCompletionDate = item.expectedProcessCompletionDate;

        const createResponse = await productionAPI.createProductionFromBOM(payload);

        if (!createResponse.status) {
          throw new Error(createResponse.message || `Failed to create process for ${item.itemName}`);
        }

        createdProcesses.push({
          processId: createResponse.data.id,
          docNumber: createResponse.data.docNumber,
          itemName: item.itemName
        });

        toast.success(`Created process ${createResponse.data.docNumber} for ${item.itemName}`);
      }

      if (createdProcesses.length > 0) {
        toast.success(`Successfully created ${createdProcesses.length} production process(es)`);
        
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

        <SelectContent onKeyDown={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 h-8"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
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

  const BOMSelect = ({
    value,
    onChange,
    rowIndex,
  }: {
    value: string;
    onChange: (value: string) => void;
    rowIndex: number;
  }) => {
    const rowSpecificBoms = rowBoms[rowIndex] || [];
    const hasItemSelected = !!productionItems[rowIndex]?.itemId;
    const isLoaded = rowBomsLoaded[rowIndex] || false;

    // If the item-specific fetch completed, use those results (even if empty).
    // Only fall back to all BOMs if the fetch hasn't run yet.
    const effectiveList = isLoaded
      ? rowSpecificBoms.filter(
          (bom) =>
            bom.docNumber.toLowerCase().includes(searchBomQuery.toLowerCase()) ||
            bom.docName.toLowerCase().includes(searchBomQuery.toLowerCase())
        )
      : filteredBoms;

    const isRowLoading = rowLoadingBOMs[rowIndex] || false;
    const isLoading = isRowLoading || loadingBOMs;

    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select BOM" />
        </SelectTrigger>

        <SelectContent onKeyDown={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-8 h-8"
                placeholder="Search BOM..."
                value={searchBomQuery}
                onChange={(e) => setSearchBomQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {!hasItemSelected ? (
            <p className="text-center py-4 text-sm">
              Select an item first
            </p>
          ) : isLoading ? (
            <div className="text-center py-3">
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            </div>
          ) : effectiveList.length === 0 ? (
            <div className="flex flex-col items-center py-4 gap-2">
              <p className="text-sm text-gray-500">No BOMs found for this item</p>
              <button
                className="flex items-center gap-1 text-sm font-medium text-[#105076] hover:underline"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate("/production/bom/create");
                }}
              >
                + Create BOM
              </button>
            </div>
          ) : (
            effectiveList.map((bom) => (
              <SelectItem
                key={bom.id}
                value={`ID: ${bom.id} - ${bom.docNumber}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{bom.docNumber}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="p-6 max-w-8xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[#105076]">
            Create Production Order 
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Create production process for the selected item
          </p>
        </div>
      </div>

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
              </TableRow>
            </TableHeader>

            <TableBody>
              {productionItems.map((row, index) => (
                <TableRow key={index} className="whitespace-nowrap">
                  <TableCell>1</TableCell>

                  <TableCell>
                    <ItemSelect
                      value={row.itemId}
                      onChange={(v) => handleItemSelect(index, v)}
                    />
                  </TableCell>

                  <TableCell>
                    <Input value={row.itemName} readOnly className="min-w-[150px]" />
                  </TableCell>

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

                  <TableCell>
                    <BOMSelect
                      value={row.bom}
                      onChange={(v) => updateItemField(index, "bom", v)}
                      rowIndex={index}
                    />
                  </TableCell>

                  <TableCell>
                    <Input value={row.currentStock} readOnly className="min-w-[100px]" />
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItemField(index, "quantity", e.target.value)
                      }
                      className="min-w-[100px]"
                      placeholder="0"
                    />
                  </TableCell>

                  <TableCell>
                    <Input value={row.uom} readOnly className="min-w-[100px]" />
                  </TableCell>

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-700">Summary</h3>
            <p className="text-sm text-gray-600">
              1 item selected for production
              {workOrderData && (
                <span className="ml-2 text-green-600">
                  • Pre-filled from work order
                </span>
              )}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Required Fields:</span> Item, Quantity, BOM
          </div>
        </div>
      </div>

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
          disabled={creatingProcess}
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
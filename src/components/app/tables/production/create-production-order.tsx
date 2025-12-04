// -------------------- FULL CREATE PRODUCTION ORDER PAGE --------------------

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
  CalendarIcon,
  Search,
  Loader2,
  Package,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

// API Helper
import { get } from "@/lib/apiService";

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

// -------------------- COMPONENT --------------------
const CreateProductionOrder: React.FC = () => {
  const navigate = useNavigate();

  // INVENTORY
  const [loadingItems, setLoadingItems] = useState(false);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // WAREHOUSES
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

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
          setWarehouses(response.data); // [{ id, name }]
        }
      } catch (err) {
        console.log("Warehouse Error:", err);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    loadWarehouses();
  }, []);

  // -------------------- FILTER ITEMS --------------------
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
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

  // -------------------- SUBMIT --------------------
  const handleSubmit = () => {
    const isInvalid = productionItems.some(
      (p) => !p.itemId || !p.quantity || !p.fgStore || !p.rmStore || !p.scrapStore
    );

    if (isInvalid) {
      alert("Please fill required fields");
      return;
    }

    console.log("SUBMIT:", productionItems);
    alert("Production Order Created!");
    navigate("/production");
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
                {item.name} — SKU: {item.sku}
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
        <h2 className="text-2xl font-bold text-[#105076]">
          Create Production Order
        </h2>
      </div>

      {/* ADD ROW BUTTON */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={addItemRow}
          className="bg-[#105076] hover:bg-[#0d4566] text-white"
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
                <TableHead className="whitespace-nowrap min-w-[200px]">Item</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Item Name</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">Document Series</TableHead>
                <TableHead className="whitespace-nowrap min-w-[120px]">BOM</TableHead>
                <TableHead className="whitespace-nowrap min-w-[100px]">Stock</TableHead>
                <TableHead className="whitespace-nowrap min-w-[80px]">Qty</TableHead>
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

                  {/* BOM Static */}
                  <TableCell>
                    <Select
                      value={row.bom}
                      onValueChange={(v) => updateItemField(index, "bom", v)}
                    >
                      <SelectTrigger className="min-w-[120px]">
                        <SelectValue placeholder="BOM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOM0001">BOM0001</SelectItem>
                        <SelectItem value="BOM0002">BOM0002</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Stock */}
                  <TableCell>
                    <Input value={row.currentStock} readOnly className="min-w-[100px]" />
                  </TableCell>

                  {/* Qty */}
                  <TableCell>
                    <Input
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        updateItemField(index, "quantity", e.target.value)
                      }
                      className="min-w-[80px]"
                    />
                  </TableCell>

                  {/* UOM */}
                  <TableCell>
                    <Input value={row.uom} readOnly className="min-w-[100px]" />
                  </TableCell>

                  {/* Reference Number — NOW INPUT */}
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
                      disabled={row.useSameStore}
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
                      disabled={row.useSameStore}
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
                      disabled={row.useSameStore}
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
                    />
                  </TableCell>

                  {/* Delete */}
                  <TableCell>
                    {productionItems.length > 1 && (
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

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          className="bg-[#105076] hover:bg-[#0d4566]"
          onClick={handleSubmit}
        >
          Create Process
        </Button>
      </div>
    </div>
  );
};

export default CreateProductionOrder;

// -------------------- END OF FILE --------------------
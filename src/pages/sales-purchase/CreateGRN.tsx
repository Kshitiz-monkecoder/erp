import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  // SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Plus } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import ShowSuppliers from "@/components/app/modals/ShowSuppliers";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import InputDatePicker from "@/components/app/InputDatePicker";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";

type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};

// type Item = {
//   itemId: number;
//   itemDescription: string;
//   hsnSacCode: string;
//   quantity: string;
//   unit: string;
//   price: number;
//   tax: number;
//   totalBeforeTax: number;
//   accepted?: number;
//   itemRemarks?: string;
// };

type Item = {
  poItem: {
    quantity: number;
    unitPrice: string;
    tax: string;
    totalPrice: string;
    id: string;
    createdAt: string;
    updatedAt: string;
  };
  item: {
    sku: string;
    name: string;
    isProduct: boolean;
    type: string;
    defaultPrice: string;
    hsnCode: string;
    id: number;
    regularBuyingPrice: string;
    regularSellingPrice: string;
    wholesaleBuyingPrice: string;
    mrp: string;
    dealerPrice: string;
    distributorPrice: string;
  };
  quantity: string;
  deliveryDate: string;
  delivered: string;
  remarks?: string;
  accepted?: string;
  id: number;
  createdAt: string;
  updatedAt: string;
};

type ValidationErrors = {
  selectedSupplier?: string;
  documentNumber?: string;
  documentDate?: string;
  deliveryDate?: string;
  poNumber?: string;
  purchaseInword?: string;
  warehouseId?: string;
  zoneId?: string;
  items?: string;
};

import { get, post } from "../../lib/apiService";
import { useNavigate, useParams } from "react-router";
import PurchaseGRNTable from "@/components/app/tables/sales-purchase/PurchaseGRNTable";
import { Loader2 } from "lucide-react";

// ── Warehouse hierarchy types ─────────────────────────────────────────────────
interface HierarchyRack { rackId: number; rackName: string; items: any[] }
interface HierarchyZone { zoneId: number; zoneName: string; racks: Record<string, HierarchyRack> }
interface WarehouseHierarchy { warehouseId: number; zones: Record<string, HierarchyZone> }
const getZones = (h: WarehouseHierarchy | null): HierarchyZone[] =>
  h ? Object.values(h.zones) : [];
const getRacks = (h: WarehouseHierarchy | null, zoneId: string): HierarchyRack[] => {
  if (!h || !zoneId) return [];
  return h.zones[zoneId] ? Object.values(h.zones[zoneId].racks) : [];
};

const CreateGRN: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>();
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);

  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [_poNumber, setPoNumber] = useState(() => {
    const timeline = JSON.parse(
      localStorage.getItem("purchaseOrderTimeline") || "[]"
    );
    const poItems = timeline.filter((item: any) => item.type === "PO");
    return poItems.length > 0 ? poItems[0].id.toString() : "";
  });
  const [inwords, setInwords] = useState<Record<string, any> | null>(null);
  const [_purchaseInword, setPurchaseInword] = useState<string>("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [warehouseHierarchy, setWarehouseHierarchy] = useState<WarehouseHierarchy | null>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [zoneId, setZoneId] = useState<string>("");
  const [rackId, setRackId] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  // const [purchaseOrders, setPurchaseOrders] = useState<Record<
  //   string,
  //   any
  // > | null>(null);

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stable setItems function to prevent unnecessary re-renders
  const stableSetItems = useCallback((newItems: Item[] | ((prev: Item[]) => Item[])) => {
    setItems(newItems);
  }, []);

  const toggleAddWarehouseModal = () => {
    setShowAddWarehouseModal((prev) => !prev);
  };

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const data = await get(`/inventory/purchase-order/${id}`);
  //       setPurchaseOrders(data?.data ?? null);
  //       setItems(data?.data?.items ?? []);
  //       setPoNumber(data?.data?.documentNumber);
  //       console.log(data?.data);
  //     } catch (error) {
  //       console.log("Error fetching data:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // Clear specific field error when user starts typing/selecting
  const clearFieldError = (fieldName: keyof ValidationErrors) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate required fields
    if (!selectedSupplier) {
      newErrors.selectedSupplier = "Supplier selection is required";
    }

    if (!documentNumber.trim()) {
      newErrors.documentNumber = "Document number is required";
    }

    if (!documentDate.trim()) {
      newErrors.documentDate = "Document date is required";
    }

    if (!deliveryDate.trim()) {
      newErrors.deliveryDate = "Delivery date is required";
    }

    // if (!poNumber.trim()) {
    //   newErrors.poNumber = "PO number is required";
    // }

    // if (purchaseInword === "") {
    //   newErrors.purchaseInword = "Purchase inword is required";
    // }

    if (!warehouseId) {
      newErrors.warehouseId = "Warehouse selection is required";
    }

    if (!zoneId) {
      newErrors.zoneId = "Zone selection is required";
    }

    // Validate items
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const supplier = localStorage.getItem("selectedSupplier");
    if (supplier) setSelectedSupplier(JSON.parse(supplier));
  }, []);

  useEffect(() => {
    console.log("warehouseId updated:", warehouseId);
  }, [warehouseId]);

  // Fetch warehouse hierarchy whenever warehouseId changes
  useEffect(() => {
    setZoneId("");
    setRackId("");
    setWarehouseHierarchy(null);
    if (!warehouseId) return;
    setHierarchyLoading(true);
    get(`/inventory/store/stock/hierarchy/${warehouseId}`)
      .then((d) => { if (d?.status) setWarehouseHierarchy(d.data); })
      .catch(() => {/* zones/racks optional — silent fail */})
      .finally(() => setHierarchyLoading(false));
  }, [warehouseId]);

  useEffect(() => {
    const fetchInwardDocuments = async () => {
      try {
        const data = await get("/inventory/inward/" + id);
        console.log(data);
        setInwords(data?.data || []);
        console.log("data.data.documentNumber ", data.data);
        setPurchaseInword(data.data.documentNumber || "");
        setPoNumber(data?.data.purchaseOrder.documentNumber || "");
        console.log("data.data.items", data.data);
        setItems(data.data.items || []);
      } catch (error) {
        console.error("Error fetching inward documents:", error);
        setInwords(null);
      }
    };

    fetchInwardDocuments();
  }, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch(
  //         `${import.meta.env.VITE_BASE_URL}/inventory/purchase-order`,
  //         {
  //           method: "GET",
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `${localStorage.getItem("token")}`,
  //           },
  //         }
  //       );
  //       const data = await response.json();
  //       console.log(data.data);
  //       setPurchaseOrders(data?.data || []);

  //       console.log(data?.data);
  //     } catch (error) {
  //       console.log("Error fetching data:", error);
  //     }
  //   };

  //   fetchData();
  // }, []);
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const result = await get("/inventory/warehouse");
        console.log(result);
        setWarehouses(result.data as warehouse[]);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
        ErrorToast({
          title: "Failed to load warehouses",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    };
    fetchWarehouses();
  }, [showAddWarehouseModal]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      ErrorToast({
        title: "Form Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const processedItems = items.map((item) => ({
        itemId: item.item.id,
        accepted: Number(item.accepted) || 0,
        remarks: item.remarks || "",
      }));

      const payload = {
        supplierId: selectedSupplier.id.toString(),
        documentNumber,
        documentDate,
        deliveryDate,
        poNumber: inwords?.purchaseOrder.id,
        purchaseInword: inwords?.id,
        warehouseId: Number(warehouseId),
        ...(zoneId ? { zoneId: Number(zoneId) } : {}),
        ...(rackId ? { rackId: Number(rackId) } : {}),
        grnStatus: "PENDING",
        remarks,
        items: processedItems,
      };

      console.log("Payload:", payload);

      const data = await post("/inventory/grn", payload);
      console.log("GRN created:", data);

      if (data?.data?.status === "PENDING" || data?.status) {
        SuccessToast({
          title: "Purchase GRN submitted successfully.",
          description: "",
        });
        navigate("/sales-purchase");
      } else {
        ErrorToast({
          title: "Failed to submit purchase GRN",
          description: "",
        });
      }
    } catch (err: any) {
      console.error("Failed to create GRN:", err);
      ErrorToast({
        title: "Failed to create GRN",
        description: err?.message || "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handlePurchaseInwordChange = (
  //   e: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const value = e.target.value;
  //   if (value === "") {
  //     setPurchaseInword("");
  //   } else {
  //     const numValue = Number(value);
  //     if (!isNaN(numValue) && numValue >= 0) {
  //       setPurchaseInword(numValue);
  //     }
  //   }
  //   clearFieldError("purchaseInword");
  // };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await get("/inventory/grn");
        if (data?.status) {
          console.log("Fetched items:", data.data);

          if (data.data && data.data.length > 0) {
            const maxDocumentNumber = Math.max(
              ...data.data.map((item: any) => {
                const docNum =
                  item.documentNumber?.toString().replace(/^DOC-0*/, "") || "0";
                return parseInt(docNum) || 0;
              })
            );

            // Format with prefixes and zero padding
            const nextDocNumber = (maxDocumentNumber + 1)
              .toString()
              .padStart(2, "0");
            setDocumentNumber(`DOC-00${nextDocNumber}`);

            console.log("Next Document Number:", `DOC-00${nextDocNumber}`);
          } else {
            // If no data, start with 01
            setDocumentNumber("DOC-01");
          }
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
        // Set default values in case of error
        setDocumentNumber("DOC-01");
      }
    };
    fetchItems();
  }, []);
  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="flex flex-col w-full justify-between space-y-6">
          {/* Suppliers details Card */}
          <div className="border-[1.5px] h-fit rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Supplier Details</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
                onClick={() => setShowSuppliersModal(true)}
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">{selectedSupplier?.name || ""}</div>
              <div className="font-medium">
                {selectedSupplier?.companyName || ""}
              </div>
              <div>
                <span className="font-medium">GSTIN:</span>{" "}
                {selectedSupplier?.gstNumber}
              </div>
              <p>
                {selectedSupplier?.addressLine1}
                {selectedSupplier?.addressLine2
                  ? `, ${selectedSupplier?.addressLine2}`
                  : ""}
                , {selectedSupplier?.city}, {selectedSupplier?.state?.name},{" "}
                {selectedSupplier?.country?.name} - {selectedSupplier?.pincode}
              </p>
            </div>
            {errors.selectedSupplier && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">
                  {errors.selectedSupplier}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* GRN Details form */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
            <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">GRN Details</h4>
            </div>
            <form className="space-y-2 px-4 py-3 ">
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="documentNumber">
                    Document Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.documentNumber ? "border-red-500" : ""
                    }`}
                    placeholder="Document Number"
                    name="documentNumber"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      clearFieldError("documentNumber");
                    }}
                  />
                  {errors.documentNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.documentNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="documentDate">
                    Document Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="documentDate"
                    onChange={(dateString) => {
                      setDocumentDate(dateString);
                      clearFieldError("documentDate");
                    }}
                  />
                  {errors.documentDate && (
                    <p className="text-red-500 text-xs">
                      {errors.documentDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="deliveryDate">
                    Delivery Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="deliveryDate"
                    onChange={(dateString) => {
                      setDeliveryDate(dateString);
                      clearFieldError("deliveryDate");
                    }}
                  />
                  {errors.deliveryDate && (
                    <p className="text-red-500 text-xs">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poNumber">
                    PO Number <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="poNumber"
                    value={inwords?.purchaseOrder?.documentNumber}
                    onValueChange={(val) => {
                      setPoNumber(val);
                      clearFieldError("poNumber");
                    }}
                    disabled={true}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${
                        errors.poNumber ? "border-red-500" : ""
                      }`}
                      disabled={true} // Add disabled prop here
                    >
                      <SelectValue placeholder="Select PO Number" />
                    </SelectTrigger>
                    {inwords?.purchaseOrder && (
                      <SelectContent>
                        <SelectItem
                          value={inwords?.purchaseOrder?.documentNumber ?? ""}
                        >
                          {inwords?.purchaseOrder?.documentNumber ?? ""}
                        </SelectItem>
                      </SelectContent>
                    )}
                  </Select>
                  {errors.poNumber && (
                    <p className="text-red-500 text-xs">{errors.poNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="purchaseInword">
                    Purchase Inword{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="purchaseInword"
                    value={inwords?.documentNumber || ""}
                    onValueChange={(val) => {
                      setPurchaseInword(val);
                      clearFieldError("purchaseInword");
                    }}
                    disabled={true}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${
                        errors.purchaseInword ? "border-red-500" : ""
                      } cursor-not-allowed opacity-50`}
                    >
                      <SelectValue placeholder="Select Purchase Inword" />
                    </SelectTrigger>
                    {inwords && (
                      <SelectContent>
                        <SelectItem
                          value={inwords?.documentNumber ?? ""}
                        >
                          {inwords?.documentNumber ?? ""}
                        </SelectItem>
                      </SelectContent>
                    )}
                  </Select>
                  {errors.purchaseInword && (
                    <p className="text-red-500 text-xs">
                      {errors.purchaseInword}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 space-y-2">
                      <Label className={labelClasses} htmlFor="warehouse">
                        Warehouse
                        <span className="text-[#F53D6B] ml-1">*</span>
                      </Label>
                      <div
                        onClick={toggleAddWarehouseModal}
                        className="text-xs flex items-center text-[#7047EB] underline underline-offset-2 cursor-pointer"
                      >
                        <Plus className="w-3" /> Add
                      </div>
                    </div>

                    <Select
                      name="warehouse"
                      value={warehouseId != null ? warehouseId.toString() : ""}
                      onValueChange={(val) => {
                        setWarehouseId(Number(val));
                        clearFieldError("warehouseId");
                      }}
                    >
                      <SelectTrigger
                        className={`${inputClasses} w-full ${
                          errors.warehouseId ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem
                            value={warehouse.id.toString()}
                            key={warehouse.id}
                          >
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.warehouseId && (
                      <p className="text-red-500 text-xs">
                        {errors.warehouseId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Zone (optional) — cascades from warehouse hierarchy */}
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="zone">
                    Zone
                    <span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  {hierarchyLoading ? (
                    <div className={`${inputClasses} w-full flex items-center gap-2 h-9 px-3 rounded-md border border-neutral-200/70 bg-white opacity-60 cursor-not-allowed`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-400">Loading zones…</span>
                    </div>
                  ) : (
                    <>
                      <Select
                        name="zone"
                        value={zoneId}
                        onValueChange={(val) => {
                          setZoneId(val);
                          setRackId("");
                          clearFieldError("zoneId");
                        }}
                        disabled={!warehouseId || getZones(warehouseHierarchy).length === 0}
                      >
                        <SelectTrigger className={`${inputClasses} w-full ${errors.zoneId ? "border-red-500" : ""}`}>
                          <SelectValue placeholder={
                            !warehouseId ? "Select warehouse first" :
                            getZones(warehouseHierarchy).length === 0 ? "No zones available" :
                            "Select zone"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {getZones(warehouseHierarchy).map((z) => (
                            <SelectItem key={z.zoneId} value={String(z.zoneId)}>
                              {z.zoneName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.zoneId && (
                        <p className="text-red-500 text-xs">{errors.zoneId}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Rack (optional) — cascades from zone */}
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="rack">
                    Rack
                    <span className="text-gray-400 ml-1 font-normal">(Optional)</span>
                  </Label>
                  <Select
                    name="rack"
                    value={rackId}
                    onValueChange={setRackId}
                    disabled={!zoneId || getRacks(warehouseHierarchy, zoneId).length === 0}
                  >
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder={
                        !zoneId ? "Select zone first" :
                        getRacks(warehouseHierarchy, zoneId).length === 0 ? "No racks available" :
                        "Select rack"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {getRacks(warehouseHierarchy, zoneId).map((r) => (
                        <SelectItem key={r.rackId} value={String(r.rackId)}>
                          {r.rackName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="remarks">
                  Remarks
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  name="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional comments or remarks"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <PurchaseGRNTable items={items} setItems={stableSetItems} />
        {errors.items && (
          <div className="px-4 pb-2">
            <p className="text-red-500 text-xs">{errors.items}</p>
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end mt-8">
        <Button
          className="bg-[#7047EB] text-white hover:bg-[#5a36b8] focus:ring-2 focus:ring-[#7047EB] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          variant="secondary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Purchase GRN"}
        </Button>
      </div>

      {/* Modals */}
      <ShowSuppliers
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
        onSelectSupplier={(supplier: any) => {
          localStorage.setItem("selectedSupplier", JSON.stringify(supplier));
          setSelectedSupplier(supplier);
          clearFieldError("selectedSupplier");
        }}
      />

      <AddWarehouseModal
        isOpen={showAddWarehouseModal}
        onClose={toggleAddWarehouseModal}
      />
    </div>
  );
};

export default CreateGRN;
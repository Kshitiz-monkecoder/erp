// import PurchaseOrdertable from "@/components/app/tables/sales-purchase/PurchaseOrderTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import ShowSuppliers from "@/components/app/modals/ShowSuppliers";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import InputDatePicker from "@/components/app/InputDatePicker";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { useNavigate, useParams } from "react-router";
import PurchaseInwardTable from "@/components/app/tables/sales-purchase/PurchaseInwardTable";
import { get, post } from "../../lib/apiService";

type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};

type Item = {
  quantity: number;
  delivered?: number;
  deliveryDate?: string;
  remarks?: string;
  unitPrice: string;
  tax: string;
  totalPrice: string;
  id: number;
  createdAt: string;
  updatedAt: string;
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
};

type ValidationErrors = {
  selectedSupplier?: string;
  documentNumber?: string;
  documentDate?: string;
  deliveryDate?: string;
  poNumber?: string;
  invoice?: string;
  invoiceDate?: string;
  deliveryChallanNumber?: string;
  deliveryChallanDate?: string;
  warehouseId?: string;
  transporterName?: string;
  transportationDocumentNumber?: string;
  vehicleNumber?: string;
  transportationDocumentDate?: string;
  items?: string;
};

const CreateInword: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>();
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<Record<
    string,
    any
  > | null>(null);

  // const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  // const [totalTax, setTotalTax] = useState(0);
  // const [totalAfterTax, setTotalAfterTax] = useState(0);

  // Required fields based on API structure
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [_poNumber, setPoNumber] = useState("");
  const [invoice, setInvoice] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [deliveryChallanNumber, setDeliveryChallanNumber] = useState("");
  const [deliveryChallanDate, setDeliveryChallanDate] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [transporterName, setTransporterName] = useState("");
  const [transportationDocumentNumber, setTransportationDocumentNumber] =
    useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transportationDocumentDate, setTransportationDocumentDate] =
    useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await get(`/inventory/purchase-order/${id}`);
        setPurchaseOrders(data?.data ?? null);
        setItems(data?.data?.items ?? []);
        setPoNumber(data?.data?.documentNumber);
        console.log(data?.data);
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const handleTotalsChange = ({
  //   totalBeforeTax: tb,
  //   totalTax: tx,
  //   totalAfterTax: ta,
  // }: {
  //   totalBeforeTax: number;
  //   totalTax: number;
  //   totalAfterTax: number;
  // }) => {
  //   setTotalBeforeTax(tb);
  //   setTotalTax(tx);
  //   setTotalAfterTax(ta);
  // };

  const toggleAddWarehouseModal = () => {
    setShowAddWarehouseModal((prev) => !prev);
  };

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

    if (!invoice.trim()) {
      newErrors.invoice = "Invoice number is required";
    }

    if (!invoiceDate.trim()) {
      newErrors.invoiceDate = "Invoice date is required";
    }

    if (!deliveryChallanNumber.trim()) {
      newErrors.deliveryChallanNumber = "Delivery challan number is required";
    }

    if (!deliveryChallanDate.trim()) {
      newErrors.deliveryChallanDate = "Delivery challan date is required";
    }

    if (!warehouseId) {
      newErrors.warehouseId = "Warehouse selection is required";
    }

    // if (!transporterName.trim()) {
    //   newErrors.transporterName = "Transporter name is required";
    // }

    // if (!transportationDocumentNumber.trim()) {
    //   newErrors.transportationDocumentNumber =
    //     "Transportation document number is required";
    // }

    // if (!vehicleNumber.trim()) {
    //   newErrors.vehicleNumber = "Vehicle number is required";
    // }

    // if (!transportationDocumentDate.trim()) {
    //   newErrors.transportationDocumentDate =
    //     "Transportation document date is required";
    // }

    // Validate items
    // if (
    //   items.length === 0 ||
    //   items.every((item) => !item.itemDescription.trim())
    // ) {
    //   newErrors.items = "At least one item is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const supplier = localStorage.getItem("selectedSupplier");
    if (supplier) setSelectedSupplier(JSON.parse(supplier));
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const result = await get(`/inventory/warehouse`);
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
        itemId: Number(item.item.id),
        id: Number(item.item.id),
        quantity: Number(item.quantity),
        deliveryDate: item.deliveryDate || deliveryDate,
        delivered: Number(item.delivered) || Number(item.quantity),
        remarks: item.remarks || "",
      }));

      const payload = {
        supplierId: selectedSupplier.id.toString(),
        documentNumber,
        documentDate,
        deliveryDate,
        poNumber: id,
        invoice,
        invoiceDate,
        deliveryChallanNumber,
        deliveryChallanDate,
        warehouseId: warehouseId!,
        transporterName,
        transportationDocumentNumber,
        vehicleNumber,
        transportationDocumentDate,
        inwardStatus: "PENDING",
        remarks,
        items: processedItems,
      };

      console.log("Payload:", payload);

      const data = await post("/inventory/inward", payload);
      console.log("Inward created:", data);

      SuccessToast({
        title: "Purchase inward submitted successfully.",
        description: "",
      });
      navigate("/sales-purchase");
    } catch (err: any) {
      console.error("Failed to create inward:", err);
      ErrorToast({
        title: "Failed to create inward",
        description: err?.message || "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await get("/inventory/inward");
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
        {/* Suppliers details Card */}
        <div className="flex flex-col justify-between">
          <div className="border-[1.5px] rounded-lg h-full border-neutral-200 text-sm">
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
          {/* Transportation Details */}
          <div className="mt-5 border-[1.5px] rounded-lg border-neutral-200 text-sm">
            <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Transportation Details</h4>
            </div>
            <form className="space-y-3 px-4 py-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="transporterName">
                    Transporter Name{" "}
                    {/* <span className="text-[#F53D6B] -mr-2">*</span> */}
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.transporterName ? "border-red-500" : ""
                    }`}
                    placeholder="Transporter Name"
                    name="transporterName"
                    value={transporterName}
                    onChange={(e) => {
                      setTransporterName(e.target.value);
                      clearFieldError("transporterName");
                    }}
                  />
                  {errors.transporterName && (
                    <p className="text-red-500 text-xs">
                      {errors.transporterName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    className={labelClasses}
                    htmlFor="transportationDocumentNumber"
                  >
                    Transportation Document Number{" "}
                    {/* <span className="text-[#F53D6B] -mr-2">*</span> */}
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.transportationDocumentNumber
                        ? "border-red-500"
                        : ""
                    }`}
                    placeholder="Transportation Document Number"
                    name="transportationDocumentNumber"
                    value={transportationDocumentNumber}
                    onChange={(e) => {
                      setTransportationDocumentNumber(e.target.value);
                      clearFieldError("transportationDocumentNumber");
                    }}
                  />
                  {errors.transportationDocumentNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.transportationDocumentNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="vehicleNumber">
                    Vehicle Number{" "}
                    {/* <span className="text-[#F53D6B] -mr-2">*</span> */}
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.vehicleNumber ? "border-red-500" : ""
                    }`}
                    placeholder="Vehicle Number"
                    name="vehicleNumber"
                    value={vehicleNumber}
                    onChange={(e) => {
                      setVehicleNumber(e.target.value);
                      clearFieldError("vehicleNumber");
                    }}
                  />
                  {errors.vehicleNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.vehicleNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    className={labelClasses}
                    htmlFor="transportationDocumentDate"
                  >
                    Transportation Document Date{" "}
                    {/* <span className="text-[#F53D6B] -mr-2">*</span> */}
                  </Label>
                  <InputDatePicker
                    name="transportationDocumentDate"
                    onChange={(dateString) => {
                      setTransportationDocumentDate(dateString);
                      clearFieldError("transportationDocumentDate");
                    }}
                  />
                  {errors.transportationDocumentDate && (
                    <p className="text-red-500 text-xs">
                      {errors.transportationDocumentDate}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Inward Details Form */}
        <div className="border-[1.5px] rounded-lg border-neutral-200 text-sm">
          <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
            <h4 className="font-semibold">Inward Details</h4>
          </div>
          <form className="space-y-3 px-4 py-3">
            <div className="grid md:grid-cols-2 gap-3">
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
                  Document Date <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <InputDatePicker
                  name="documentDate"
                  onChange={(dateString) => {
                    setDocumentDate(dateString);
                    clearFieldError("documentDate");
                  }}
                />
                {errors.documentDate && (
                  <p className="text-red-500 text-xs">{errors.documentDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="deliveryDate">
                  Delivery Date <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <InputDatePicker
                  name="deliveryDate"
                  onChange={(dateString) => {
                    setDeliveryDate(dateString);
                    clearFieldError("deliveryDate");
                  }}
                />
                {errors.deliveryDate && (
                  <p className="text-red-500 text-xs">{errors.deliveryDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={`${labelClasses} w-full`} htmlFor="poNumber">
                  PO Number <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Select
                  name="poNumber"
                  value={purchaseOrders?.documentNumber}
                  disabled={true}
                  onValueChange={(val) => {
                    setPoNumber(val);
                    clearFieldError("poNumber");
                  }}
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${
                      errors.poNumber ? "border-red-500" : ""
                    }`}
                    disabled={true} // Add disabled prop here
                  >
                    <SelectValue placeholder="Select PO Number" />
                  </SelectTrigger>
                  {purchaseOrders && (
                    <SelectContent>
                      <SelectItem value={purchaseOrders?.documentNumber ?? ""}>
                        {purchaseOrders?.documentNumber ?? ""}
                      </SelectItem>
                    </SelectContent>
                  )}
                </Select>
                {errors.poNumber && (
                  <p className="text-red-500 text-xs">{errors.poNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="invoice">
                  Invoice <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${
                    errors.invoice ? "border-red-500" : ""
                  }`}
                  placeholder="Invoice Number"
                  name="invoice"
                  value={invoice}
                  onChange={(e) => {
                    setInvoice(e.target.value);
                    clearFieldError("invoice");
                  }}
                />
                {errors.invoice && (
                  <p className="text-red-500 text-xs">{errors.invoice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="invoiceDate">
                  Invoice Date <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <InputDatePicker
                  name="invoiceDate"
                  onChange={(dateString) => {
                    setInvoiceDate(dateString);
                    clearFieldError("invoiceDate");
                  }}
                />
                {errors.invoiceDate && (
                  <p className="text-red-500 text-xs">{errors.invoiceDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="deliveryChallanNumber">
                  Delivery Challan Number{" "}
                  <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${
                    errors.deliveryChallanNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Delivery Challan Number"
                  name="deliveryChallanNumber"
                  value={deliveryChallanNumber}
                  onChange={(e) => {
                    setDeliveryChallanNumber(e.target.value);
                    clearFieldError("deliveryChallanNumber");
                  }}
                />
                {errors.deliveryChallanNumber && (
                  <p className="text-red-500 text-xs">
                    {errors.deliveryChallanNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="deliveryChallanDate">
                  Delivery Challan Date{" "}
                  <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <InputDatePicker
                  name="deliveryChallanDate"
                  onChange={(dateString) => {
                    setDeliveryChallanDate(dateString);
                    clearFieldError("deliveryChallanDate");
                  }}
                />
                {errors.deliveryChallanDate && (
                  <p className="text-red-500 text-xs">
                    {errors.deliveryChallanDate}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className={labelClasses} htmlFor="warehouse">
                    Warehouse <span className="text-[#F53D6B] ml-1">*</span>
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
                  <p className="text-red-500 text-xs">{errors.warehouseId}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Remarks and Submit */}
      <div className="w-full max-w-96 text-sm space-y-4 mt-5">
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
      </div>

      <div className="w-full mt-5">
        <PurchaseInwardTable
          items={items}
          setItems={setItems}
          // onTotalsChange={handleTotalsChange}
        />
      </div>

      <div className="space-y-3 text-xs md:text-sm w-full max-w-84">
        {/* <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total (before tax) :</div>
            <div>₹{totalBeforeTax.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total Tax :</div>
            <div>₹{totalTax.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total (after tax) :</div>
            <div>₹{totalAfterTax.toFixed(2)}</div>
          </div>
          <div className="block border" />
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Grand Total :</div>
            <div>₹{totalAfterTax.toFixed(2)}</div>
          </div> */}

        <br />
        <Button
          className="mt-4 bg-[#7047EB] text-white hover:bg-[#5a36b8] focus:ring-2 focus:ring-[#7047EB] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          variant="secondary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Purchase Inward"}
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

export default CreateInword;

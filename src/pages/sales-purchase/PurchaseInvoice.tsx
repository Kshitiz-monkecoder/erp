import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
import ShowBuyers from "@/components/app/modals/ShowBuyers";
import ShowLocations from "@/components/app/modals/ShowLocations";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import InputDatePicker from "@/components/app/InputDatePicker";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { useLocation, useNavigate, useParams } from "react-router";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import { get, post } from "../../lib/apiService";
import { parseDate } from "@internationalized/date";
import moment from "moment";
import InvoiceTable from "@/components/app/tables/sales-purchase/InvoiceTable";
type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};

type Item = {
  item: {
    sku: string;
    name: string;
    isProduct: boolean;
    type: string;
    currentStock: string;
    defaultPrice: string;
    hsnCode: string;
    minimumStockLevel: string;
    maximumStockLevel: string;
    id: number;
    regularBuyingPrice: string;
    regularSellingPrice: string;
    wholesaleBuyingPrice: string;
    mrp: string;
    dealerPrice: string;
    distributorPrice: string;
    lastTransactionAt: string;
  };
  hsn: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  tax: string;
  id: number;
  createdAt?: string;
  updatedAt?: string;
  // Additional properties used in component
  itemDescription?: string;
  hsnSacCode?: string;
  unit?: string;
};

type ValidationErrors = {
  selectedBuyer?: string;
  selectedSupplier?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  stateId?: string;
  countryId?: string;
  amendment?: string;
  documentNumber?: string;
  documentDate?: string;
  ocId?: string;
  ocDate?: string;
  warehouseId?: string;
  poNumber?: string;
  poDate?: string;
  paymentTerm?: string;
  paymentDate?: string;
  transporterName?: string;
  transporterGstNumber?: string;
  transportationDocumentNumber?: string;
  vehicleNumber?: string;
  payToTransporter?: string;
  transportationDocumentDate?: string;
  deliveryNote?: string;
  items?: string;
};
const PurchaseInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { purchaseOrder } = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const performa = searchParams.get("performa");

  console.log("purchaseOrder", purchaseOrder);

  const navigate = useNavigate();

  // Updated state variable names to match field labels
  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [_ocs, setOcs] = useState<any[]>([]);
  const [showBuyersModal, setShowBuyersModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>();
  const [selectedBuyer] = useState<any>(
    JSON.parse(localStorage.getItem("User") || "null")
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);

  // Place of Supply fields
  const [city, setCity] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);

  // Primary Document Details fields
  const [invoiceNumber, setInvoiceNumber] = useState(""); // Changed from documentNumber
  const [documentDate, setDocumentDate] = useState(
    moment().format("YYYY-MM-DD")
  ); // Changed from documentDate
  const [poNumber, setPoNumber] = useState(purchaseOrder?.documentNumber || ""); // Added for PO Number field
  const [poDate, setPoDate] = useState(purchaseOrder?.documentDate || ""); // Added for PO Date field
  const [paymentTerm, setPaymentTerm] = useState<string>(""); // Added for Payment Term field
  const [paymentDate, setPaymentDate] = useState(moment().format("YYYY-MM-DD")); // Added for Payment Date field
  const [store, setStore] = useState<number | null>(
    purchaseOrder?.warehouse?.id || null
  ); // Changed from warehouseId
  const [deliveryNote, setDeliveryNote] = useState("");

  // Other existing fields
  const [amendment] = useState(0);
  const [remark, setRemark] = useState("");
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [items, setItems] = useState<Item[]>(purchaseOrder?.items ?? []);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleTotalsChange = ({
    totalBeforeTax: tb,
    totalTax: tx,
    totalAfterTax: ta,
  }: {
    totalBeforeTax: number;
    totalTax: number;
    totalAfterTax: number;
  }) => {
    setTotalBeforeTax(tb);
    setTotalTax(tx);
    setTotalAfterTax(ta);
  };
  const toggleAddWarehouseModal = () => {
    setShowAddWarehouseModal((prev) => !prev);
  };
  const clearFieldError = (fieldName: keyof ValidationErrors) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!selectedBuyer) {
      newErrors.selectedBuyer = "Buyer selection is required";
    }
    if (!selectedSupplier) {
      newErrors.selectedSupplier = "Supplier selection is required";
    }
    if (!billingAddress) {
      newErrors.billingAddress = "Billing address is required";
    }
    if (!shippingAddress) {
      newErrors.shippingAddress = "Shipping address is required";
    }
    if (!city.trim()) {
      newErrors.city = "City is required";
    }
    if (!stateId) {
      newErrors.stateId = "State selection is required";
    }
    if (!countryId) {
      newErrors.countryId = "Country selection is required";
    }
    if (amendment === null || amendment === undefined) {
      newErrors.amendment = "Amendment is required";
    }
    if (!invoiceNumber.trim()) {
      newErrors.documentNumber = "Invoice number is required";
    }
    if (!documentDate.trim()) {
      newErrors.documentDate = "Document date is required";
    }
    // if (!ocNumber) {
    //   newErrors.ocId = "OC number is required";
    // }
    if (!store) {
      newErrors.warehouseId = "Store selection is required";
    }
    if (!deliveryNote.trim()) {
      newErrors.deliveryNote = "Delivery Note is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (purchaseOrder) {
      setBillingAddress(purchaseOrder?.billingAddress || null);
      setShippingAddress(purchaseOrder?.deliveryAddress || null);
      setCountryId(purchaseOrder?.placeOfSupplyCountry?.id || null);
      setStateId(purchaseOrder?.placeOfSupplyState?.id || null);
      setCity(purchaseOrder?.placeOfSupplyCity || "");
    }
  }, [purchaseOrder]);

  useEffect(() => {
    const fetchOcs = async () => {
      try {
        const result = await get(`/inventory/order-confirmation`);
        setOcs(result.data);
      } catch (error) {
        console.error("Error fetching order confirmations:", error);
        ErrorToast({
          title: "Failed to load order confirmations",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    };
    fetchOcs();
  }, []);

  useEffect(() => {
    const fetchStatesAndCountries = async () => {
      try {
        const result = await get(`/state/1`);
        setStates(result.data);
      } catch (error) {
        console.error("Error fetching states :", error);
        ErrorToast({
          title: "Failed to load states",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
      try {
        const result = await get(`/countrie`);
        setCountries(result.data);
      } catch (error) {
        console.error("Error fetching countries :", error);
        ErrorToast({
          title: "Failed to load countries",
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    };
    fetchStatesAndCountries();
  }, []);

  useEffect(() => {
    const supplier = localStorage.getItem("selectedSupplier");
    if (supplier) setSelectedSupplier(JSON.parse(supplier));
  }, [showBuyersModal]);

  const handleSelectBillingLocation = (location: any) => {
    setBillingAddress(location);
    clearFieldError("billingAddress");
    setIsLocationModalOpen(false);
  };

  const handleSelectShippingLocation = (location: any) => {
    setShippingAddress(location);
    clearFieldError("shippingAddress");
    setIsLocationModalOpen(false);
  };
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const data = await get(`/inventory/tax-invoice`);
        if (data?.status) {
          if (data.data && data.data.length > 0) {
            const maxDocumentNumber = Math.max(
              ...data.data.map((item: any) => {
                const docNum =
                  item.invoiceNumber?.toString().replace(/^IN-\d{4}-0*/, "") ||
                  "0";
                return parseInt(docNum) || 0;
              })
            );
            const nextDocNumber = (maxDocumentNumber + 1)
              .toString()
              .padStart(3, "0");
            setInvoiceNumber(`IN-${currentYear}-${nextDocNumber}`);
          } else {
            setInvoiceNumber(`IN-${currentYear}-001`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
        const currentYear = new Date().getFullYear();
        setInvoiceNumber(`IN-${currentYear}-001`);
      }
    };
    fetchItems();
  }, []);
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const result = await get(`/inventory/warehouse`);
        console.log("result.data", result.data);
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
        itemId: item.item.id, // Use the nested item's ID
        hsn: item.item.hsnCode,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        tax: Number(item.tax),
        deliveryDate: documentDate, // Add delivery date (could be configurable)
      }));

      const payload = {
        supplierId: selectedSupplier.id,
        billingAddressId: billingAddress.id,
        shippingAddressId: shippingAddress.id,
        placeOfSupplyCity: city,
        placeOfSupplyState: stateId,
        placeOfSupplyCountry: countryId,
        invoiceNumber: invoiceNumber, // Changed from documentNumber
        invoiceDate: documentDate, // Changed from documentDate
        poNumber: poNumber,
        poDate: poDate,
        poId: id,
        paymentTerms: paymentTerm,
        paymentMethod: "CREDIT", // Default payment method
        warehouseId: store,
        deliveryNote: deliveryNote,
        kindAttention: "TEST",
        items: processedItems,
        totalAmount: totalAfterTax,
        totalTaxAmount: totalTax, // Changed from tax
        totalDiscount: 0, // Add default discount value
        attachments: [], // Add empty attachments array
        signature: "Authorized Signatory", // Add default signature
        remark: remark,
        isProformaInvoice: performa === "true", // Check if performa is true
      };

      const data = await post("/inventory/tax-invoice", payload);
      if (data?.status) {
        SuccessToast({
          title: "Invoice submitted successfully.",
          description: "",
        });
        navigate("/sales-purchase?tab=purchase");
      } else {
        ErrorToast({
          title: "Failed to submit invoice",
          description: "",
        });
      }
    } catch (err: any) {
      console.log("err", err);
      console.error("Failed to create invoice:", err);
      ErrorToast({
        title: "Failed to create invoice",
        description: err?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  {
    console.log("selectedBuyer", selectedBuyer);
  }
  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="flex flex-col justify-between space-y-6 h-full">
          <div className="border-[1.5px] h-1/2 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Buyers Details</h4>
              {/* <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
                onClick={() => setShowBuyersModal(true)}
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button> */}
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">{selectedBuyer?.name || ""}</div>
              <div className="font-medium">{selectedBuyer?.email || ""}</div>
              <div>
                <span className="font-medium">Contact: </span>{" "}
                {selectedBuyer?.phone}
              </div>
            </div>
            {errors.selectedBuyer && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.selectedBuyer}</p>
              </div>
            )}
          </div>
          <div className="border-[1.5px] h-1/2 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Supplier Details</h4>
            </div>
            <div className="px-3 py-2 space-y-1">
              {/* <div className="font-medium">{selectedSupplier?.name || ""}</div>
              <div className="font-medium">{selectedSupplier?.email || ""}</div>
              <div>
                <span className="font-medium">Contact: </span>{" "}
                {selectedSupplier?.phone}
              </div> */}

              <div className="font-medium">{selectedSupplier?.name || ""}</div>
              <div className="font-medium">
                {selectedSupplier?.company?.name || ""}
              </div>
              <div>
                <span className="font-medium">GSTIN:</span>{" "}
                {selectedSupplier?.gstNumber}
              </div>
              <p>{selectedSupplier?.addressLine1}</p>
              <p>
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

        <div className="flex flex-col w-full space-y-6">
          <div className="border-[1.5px] h-1/3 min-h-44 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Billing Address</h4>
              <Button
                variant="outline"
                onClick={() => setIsLocationModalOpen(true)}
                className="border h-7 px-2 border-gray-400 font-normal"
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1 min-h-16">
              {billingAddress ? (
                <div>
                  <p className="font-medium">{billingAddress.locationName}</p>
                  <p>{billingAddress.address1}</p>
                  {billingAddress.address2 && <p>{billingAddress.address2}</p>}
                  <p>
                    {billingAddress.city}, {billingAddress.state},{" "}
                    {billingAddress.country} - {billingAddress.postalCode}
                  </p>
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                    {billingAddress.gstin}
                  </p>
                </div>
              ) : (
                <p>No billing address selected</p>
              )}
            </div>
            {errors.billingAddress && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.billingAddress}</p>
              </div>
            )}
          </div>

          <div className="border-[1.5px] h-1/3 min-h-44 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Shipping Address</h4>
              <Button
                variant="outline"
                onClick={() => setIsLocationModalOpen(true)}
                className="border h-7 px-2 border-gray-400 font-normal"
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1 min-h-16">
              {shippingAddress ? (
                <div>
                  <p className="font-medium">{shippingAddress.locationName}</p>
                  <p>{shippingAddress.address1}</p>
                  {shippingAddress.address2 && (
                    <p>{shippingAddress.address2}</p>
                  )}
                  <p>
                    {shippingAddress.city}, {shippingAddress.state},{" "}
                    {shippingAddress.country} - {shippingAddress.postalCode}
                  </p>
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                    {shippingAddress.gstin}
                  </p>
                </div>
              ) : (
                <p>No shipping address selected</p>
              )}
            </div>
            {errors.shippingAddress && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.shippingAddress}</p>
              </div>
            )}
          </div>

          <div className="border-[1.5px] h-1/3 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Place Of Supply</h4>
            </div>
            <div className="px-3 py-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="country">
                    Country <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="country"
                    value={countryId?.toString() || ""}
                    onValueChange={(value) => {
                      setCountryId(Number(value));
                      clearFieldError("countryId");
                    }}
                    disabled={true}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${
                        errors.countryId ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Country">
                        {countries.find((c) => c.id === countryId)?.name || ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {countries.map((country) => (
                          <SelectItem
                            value={country.id.toString()}
                            key={country.id}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.countryId && (
                    <p className="text-red-500 text-xs">{errors.countryId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="state">
                    State <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="state"
                    value={stateId?.toString() || ""}
                    onValueChange={(value) => {
                      setStateId(Number(value));
                      clearFieldError("stateId");
                    }}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${
                        errors.stateId ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="State">
                        {states.find((s) => s.id === stateId)?.name || ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {states.map((state) => (
                          <SelectItem
                            value={state.id.toString()}
                            key={state.id}
                          >
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.stateId && (
                    <p className="text-red-500 text-xs">{errors.stateId}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="city">
                  City <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${
                    errors.city ? "border-red-500" : ""
                  }`}
                  placeholder="City"
                  name="city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearFieldError("city");
                  }}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs">{errors.city}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="border-[1.5px] h-fit rounded-lg border-neutral-200 text-sm">
            <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Primary Document Details</h4>
            </div>
            <form className="space-y-4 px-4 py-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="invoiceNumber">
                    Invoice Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.documentNumber ? "border-red-500" : ""
                    }`}
                    placeholder="TXIN00003"
                    name="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => {
                      setInvoiceNumber(e.target.value);
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
                    Document Date
                  </Label>
                  <InputDatePicker
                    name="documentDate"
                    onChange={(dateString) => {
                      setDocumentDate(dateString);
                      clearFieldError("documentDate");
                    }}
                    value={documentDate ? parseDate(documentDate) : null}
                  />
                  {errors.documentDate && (
                    <p className="text-red-500 text-xs">
                      {errors.documentDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poNumber">
                    PO Number
                  </Label>
                  <Input
                    className={inputClasses}
                    placeholder="PO00098"
                    name="poNumber"
                    value={poNumber}
                    onChange={(e) => {
                      setPoNumber(e.target.value);
                      clearFieldError("poNumber");
                    }}
                    disabled={purchaseOrder?.poNumber ? true : false}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poDate">
                    PO Date
                  </Label>
                  <InputDatePicker
                    onChange={(dateString) => {
                      setPoDate(dateString);
                      clearFieldError("poDate");
                    }}
                    value={poDate ? parseDate(poDate) : null}
                    name="poDate"
                    disabled={purchaseOrder?.poDate ? true : false}
                  />
                </div>
              </div>

              {/* <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="ocNumber">
                    OC Number <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.ocId ? "border-red-500" : ""
                    }`}
                    placeholder="OC00001"
                    name="ocNumber"
                    value={ocNumber}
                    onChange={(e) => {
                      setOcNumber(e.target.value);
                      clearFieldError("ocId");
                    }}
                    disabled={true}
                  />
                  {errors.ocId && (
                    <p className="text-red-500 text-xs">{errors.ocId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="ocDate">
                    OC Date <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    onChange={(dateString) => {
                      setOcDate(dateString);
                      clearFieldError("ocDate");
                    }}
                    value={ocDate ? parseDate(ocDate) : null}
                    name="ocDate"
                    disabled={true}
                  />
                </div>
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="paymentTerm">
                    Payment Term
                  </Label>
                  <Select
                    name="paymentTerm"
                    value={paymentTerm}
                    onValueChange={(value) => {
                      setPaymentTerm(value);
                      clearFieldError("paymentTerm");
                    }}
                  >
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="Select payment term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="30 days">30 days</SelectItem>
                        <SelectItem value="60 days">60 days</SelectItem>
                        <SelectItem value="90 days">90 days</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="paymentDate">
                    Payment Date <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    onChange={(dateString) => {
                      setPaymentDate(dateString);
                      clearFieldError("paymentDate");
                    }}
                    value={paymentDate ? parseDate(paymentDate) : null}
                    name="paymentDate"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="store">
                  Store <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Select
                  name="store"
                  value={store?.toString() || ""}
                  onValueChange={(value) => {
                    setStore(Number(value));
                    clearFieldError("warehouseId");
                  }}
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${
                      errors.warehouseId ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder="Default Stock Store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          value={warehouse.id.toString()}
                          key={warehouse.id}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.warehouseId && (
                  <p className="text-red-500 text-xs">{errors.warehouseId}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="deliveryNote">
                  Note 
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  placeholder=""
                  name="deliveryNote"
                  value={deliveryNote}
                  onChange={(e) => {
                    setDeliveryNote(e.target.value);
                    clearFieldError("deliveryNote");
                  }}
                />
                <div className="text-right text-xs text-gray-500">0 / 500</div>
                {errors.deliveryNote && (
                  <p className="text-red-500 text-xs">{errors.deliveryNote}</p>
                )}
              </div>

              {/* <div className="space-y-2">
                <Label className={labelClasses} htmlFor="kindAttention">
                  Kind Attention
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  placeholder=""
                  name="kindAttention"
                  value={kindAttention}
                  onChange={(e) => setKindAttention(e.target.value)}
                />
                <div className="text-right text-xs text-gray-500">0 / 200</div>
              </div> */}
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <InvoiceTable
          items={items}
          setItems={setItems}
          onTotalsChange={handleTotalsChange}
        />
        {errors.items && (
          <div className="px-4 pb-2">
            <p className="text-red-500 text-xs">{errors.items}</p>
          </div>
        )}
      </div>

      <div className="flex mt-8 md:mt-10 lg:mt-16 justify-between flex-col md:flex-row gap-5">
        <div className="w-full max-w-96 text-sm space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="emailRecipients">
                Email Recipients <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                className={inputClasses}
                placeholder="Email Recipients"
                name="emailRecipients"
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="remark">
                Remarks (Optional)
              </Label>
              <Textarea
                className={`${inputClasses} max-h-32`}
                placeholder="Urgent delivery required. Please ensure all items are properly packaged."
                name="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs md:text-sm w-full max-w-84">
          <div className="flex justify-between items-center gap-2">
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
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-[#7047EB] hover:bg-[#5a3bc4]"
        >
          {isSubmitting ? "Submitting..." : "Submit Invoice"}
        </Button>
      </div>

      {/* Modals */}
      {showBuyersModal && (
        <ShowBuyers
          isOpen={showBuyersModal}
          onClose={() => setShowBuyersModal(false)}
          // onSelect={(buyer) => {
          //   setSelectedBuyer(buyer);
          //   clearFieldError("selectedBuyer");
          //   setShowBuyersModal(false);
          // }}
        />
      )}
      {isLocationModalOpen && (
        <ShowLocations
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectLocation={
            billingAddress === null
              ? handleSelectBillingLocation
              : handleSelectShippingLocation
          }
        />
      )}

      {showAddWarehouseModal && (
        <AddWarehouseModal
          isOpen={showAddWarehouseModal}
          onClose={toggleAddWarehouseModal}
          onSuccess={() => {
            // Warehouse list will be refreshed via useEffect dependency
            setShowAddWarehouseModal(false);
          }}
        />
      )}
    </div>
  );
};
export default PurchaseInvoice;

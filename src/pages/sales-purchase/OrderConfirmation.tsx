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
import { useNavigate } from "react-router";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import { get, post } from "../../lib/apiService";
import PurchaseQuotationtable from "@/components/app/tables/sales-purchase/PurchaseQuotationtable";
type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};
type Item = {
  itemId: number;
  itemDescription: string;
  hsnSacCode: string;
  quantity: string;
  unit: string;
  price: number;
  tax: number;
  totalBeforeTax: number;
};
type ValidationErrors = {
  selectedBuyer?: string;
  selectedSupplier?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  stateId?: string;
  countryId?: string;
  title?: string;
  documentNumber?: string;
  documentDate?: string;
  deliveryDate?: string;
  warehouseId?: string;
  poNumber?: string;
  poDate?: string;
  quotationNumber?: string;
  quotationDate?: string;
  paymentType?: string;
  customerEnquiryNumber?: string;
  customerEnquiryDate?: string;
  items?: string;
};
const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [showBuyersModal, setShowBuyersModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>();
  const [selectedSupplier, setSelectedSupplier] = useState<any>(
    JSON.parse(localStorage.getItem("User") || "null")
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [city, setCity] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(1);
  const [title, setTitle] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationDate, setQuotationDate] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [customerEnquiryNumber, setCustomerEnquiryNumber] = useState("");
  const [customerEnquiryDate, setCustomerEnquiryDate] = useState("");
  const [kindAttention, setKindAttention] = useState("");
  const [remark, setRemark] = useState("");
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([
    {
      itemId: -1,
      itemDescription: "",
      hsnSacCode: "",
      quantity: "1",
      unit: "",
      price: 0,
      tax: 0,
      totalBeforeTax: 0,
    },
  ]);
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
    if (!title.trim()) {
      newErrors.title = "Title is required";
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
    if (!warehouseId) {
      newErrors.warehouseId = "Warehouse selection is required";
    }
    if (!poNumber.trim()) {
      newErrors.poNumber = "PO Number is required";
    }
    if (!poDate.trim()) {
      newErrors.poDate = "PO Date is required";
    }
    if (!quotationNumber.trim()) {
      newErrors.quotationNumber = "Quotation Number is required";
    }
    if (!quotationDate.trim()) {
      newErrors.quotationDate = "Quotation Date is required";
    }
    if (!paymentType.trim()) {
      newErrors.paymentType = "Payment Type is required";
    }
    if (!customerEnquiryNumber.trim()) {
      newErrors.customerEnquiryNumber = "Customer Enquiry Number is required";
    }
    if (!customerEnquiryDate.trim()) {
      newErrors.customerEnquiryDate = "Customer Enquiry Date is required";
    }
    if (
      items.length === 0 ||
      items.every((item) => !item.itemDescription.trim())
    ) {
      newErrors.items = "At least one item is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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
    const supplier = localStorage.getItem("User");
    if (supplier) setSelectedSupplier(JSON.parse(supplier));
    const buyer = localStorage.getItem("selectedBuyer");
    if (buyer) setSelectedBuyer(JSON.parse(buyer));
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
        const data = await get(`/inventory/order-confirmation`);
        if (data?.status) {
          if (data.data && data.data.length > 0) {
            const maxDocumentNumber = Math.max(
              ...data.data.map((item: any) => {
                const docNum =
                  item.documentNumber?.toString().replace(/^OC-\d{4}-0*/, "") ||
                  "0";
                return parseInt(docNum) || 0;
              })
            );
            const nextDocNumber = (maxDocumentNumber + 1)
              .toString()
              .padStart(3, "0");
            setDocumentNumber(`OC-${currentYear}-${nextDocNumber}`);
          } else {
            setDocumentNumber(`OC-${currentYear}-001`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
        const currentYear = new Date().getFullYear();
        setDocumentNumber(`OC-${currentYear}-001`);
      }
    };
    fetchItems();
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
      const processedItems = items.map(({ itemId, ...rest }) => ({
        id: itemId,
        hsn: rest.hsnSacCode,
        unitPrice: rest.price,
        totalPrice: Number(rest.price) * Number(rest.quantity),
        quantity: Number(rest.quantity),
        tax: Number(rest.tax),
      }));
      const payload = {
        buyerId: selectedBuyer.id,
        billingAddressId: billingAddress.id,
        shippingAddressId: shippingAddress.id,
        title: title,
        documentNumber: documentNumber,
        documentDate: documentDate,
        deliveryDate: deliveryDate,
        warehouseId: warehouseId,
        totalAmount: totalAfterTax,
        tax: processedItems.reduce((prev, item) => prev + item.tax, 0),
        items: processedItems,
        placeOfSupplyCity: city,
        placeOfSupplyState: stateId,
        placeOfSupplyCountry: countryId,
        poNumber: poNumber,
        poDate: poDate,
        QuotationNumber: quotationNumber,
        QuotationDate: quotationDate,
        paymentType: paymentType,
        customerEnquiryNumber: customerEnquiryNumber,
        customerEnquiryDate: customerEnquiryDate,
        kindAttention: kindAttention,
        remark: remark,
      };
      const data = await post("/inventory/order-confirmation", payload);
      if (data?.data?.status === "PENDING") {
        SuccessToast({
          title: "Order Confirmation submitted successfully.",
          description: "",
        });
        navigate("/sales-purchase?tab=order-confirmation");
      } else {
        ErrorToast({
          title: "Failed to submit order confirmation",
          description: "",
        });
      }
    } catch (err: any) {
      console.error("Failed to create order confirmation:", err);
      ErrorToast({
        title: "Failed to create order confirmation",
        description: err?.message?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="flex flex-col justify-between space-y-6 h-full">
          <div className="border-[1.5px] h-1/2 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Buyers Details</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
                onClick={() => setShowBuyersModal(true)}
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">{selectedBuyer?.name || ""}</div>
              <div className="font-medium">
                {selectedBuyer?.companyName || ""}
              </div>
              <div>
                <span className="font-medium">GSTIN:</span>{" "}
                {selectedBuyer?.gstNumber}
              </div>
              <p>{selectedBuyer?.addressLine1}</p>
              <p>
                {selectedBuyer?.addressLine2
                  ? `, ${selectedBuyer?.addressLine2}`
                  : ""}
                , {selectedBuyer?.city}, {selectedBuyer?.state?.name},{" "}
                {selectedBuyer?.country?.name} - {selectedBuyer?.pincode}
              </p>
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
              <div className="font-medium">{selectedSupplier?.name || ""}</div>
              <div className="font-medium">{selectedSupplier?.email || ""}</div>
              <div>
                <span className="font-medium">Contact: </span>{" "}
                {selectedSupplier?.phone}
              </div>
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
                    disabled={true} // Disable country selection
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
              <h4 className="font-semibold">Order Details</h4>
            </div>
            <form className="space-y-2 px-4 py-3 ">
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="title">
                  Title <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${
                    errors.title ? "border-red-500" : ""
                  }`}
                  placeholder="Title"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearFieldError("title");
                  }}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poNumber">
                    PO Number <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.poNumber ? "border-red-500" : ""
                    }`}
                    placeholder="PO Number"
                    name="poNumber"
                    value={poNumber}
                    onChange={(e) => {
                      setPoNumber(e.target.value);
                      clearFieldError("poNumber");
                    }}
                  />
                  {errors.poNumber && (
                    <p className="text-red-500 text-xs">{errors.poNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poDate">
                    PO Date <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="poDate"
                    onChange={(dateString) => {
                      setPoDate(dateString);
                      clearFieldError("poDate");
                    }}
                  />
                  {errors.poDate && (
                    <p className="text-red-500 text-xs">{errors.poDate}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="quotationNumber">
                    Quotation Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.quotationNumber ? "border-red-500" : ""
                    }`}
                    placeholder="Quotation Number"
                    name="quotationNumber"
                    value={quotationNumber}
                    onChange={(e) => {
                      setQuotationNumber(e.target.value);
                      clearFieldError("quotationNumber");
                    }}
                  />
                  {errors.quotationNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.quotationNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="quotationDate">
                    Quotation Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="quotationDate"
                    onChange={(dateString) => {
                      setQuotationDate(dateString);
                      clearFieldError("quotationDate");
                    }}
                  />
                  {errors.quotationDate && (
                    <p className="text-red-500 text-xs">
                      {errors.quotationDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="paymentType">
                  Payment Type <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${
                    errors.paymentType ? "border-red-500" : ""
                  }`}
                  placeholder="30 days credit"
                  name="paymentType"
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value);
                    clearFieldError("paymentType");
                  }}
                />
                {errors.paymentType && (
                  <p className="text-red-500 text-xs">{errors.paymentType}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label
                    className={labelClasses}
                    htmlFor="customerEnquiryNumber"
                  >
                    Customer Enquiry Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.customerEnquiryNumber ? "border-red-500" : ""
                    }`}
                    placeholder="ENQ-001"
                    name="customerEnquiryNumber"
                    value={customerEnquiryNumber}
                    onChange={(e) => {
                      setCustomerEnquiryNumber(e.target.value);
                      clearFieldError("customerEnquiryNumber");
                    }}
                  />
                  {errors.customerEnquiryNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.customerEnquiryNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="customerEnquiryDate">
                    Customer Enquiry Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="customerEnquiryDate"
                    onChange={(dateString) => {
                      setCustomerEnquiryDate(dateString);
                      clearFieldError("customerEnquiryDate");
                    }}
                  />
                  {errors.customerEnquiryDate && (
                    <p className="text-red-500 text-xs">
                      {errors.customerEnquiryDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="warehouseId">
                  Warehouse <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    name="warehouseId"
                    value={warehouseId?.toString() || ""}
                    onValueChange={(value) => {
                      setWarehouseId(Number(value));
                      clearFieldError("warehouseId");
                    }}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${
                        errors.warehouseId ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Warehouse">
                        {warehouses.find((w) => w.id === warehouseId)?.name ||
                          ""}
                      </SelectValue>
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
                  {/* <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAddWarehouseModal}
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button> */}
                </div>
                {errors.warehouseId && (
                  <p className="text-red-500 text-xs">{errors.warehouseId}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="kindAttention">
                  Kind Attention
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  placeholder="Mr. John Smith"
                  name="kindAttention"
                  value={kindAttention}
                  onChange={(e) => setKindAttention(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <PurchaseQuotationtable
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
          {isSubmitting ? "Submitting..." : "Submit Order Confirmation"}
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
export default OrderConfirmation;

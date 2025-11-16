import PurchaseOrdertable from "@/components/app/tables/sales-purchase/PurchaseOrderTable";
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
import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import ShowBuyers from "@/components/app/modals/ShowBuyers";
import ShowSuppliers from "@/components/app/modals/ShowSuppliers";
import ShowLocations from "@/components/app/modals/ShowLocations";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import InputDatePicker from "@/components/app/InputDatePicker";
// import { toast } from "sonner"; // or import { toast } from "react-hot-toast";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";
export type warehouse = {
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  id: number;
};
import { get, post } from "../../lib/apiService";

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

export type ValidationErrors = {
  selectedBuyer?: string;
  selectedSupplier?: string;
  billingAddress?: string;
  deliveryAddress?: string;
  city?: string;
  stateId?: string;
  countryId?: string;
  title?: string;
  documentNumber?: string;
  documentDate?: string;
  ocNumber?: string;
  ocDate?: string;
  indentNumber?: string;
  indentDate?: string;
  amendment?: string;
  ocDetails?: string;
  warehouseId?: string;
  emailRecipients?: string;
  items?: string;
};

import { useNavigate } from "react-router";
import AddPurchaseItemModal from "@/components/app/modals/AddPurchaseItemModal";

const PurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [showBuyersModal, setShowBuyersModal] = useState<boolean>(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState<boolean>(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>(
    JSON.parse(localStorage.getItem("User") || "null")
  );
  const [selectedSupplier, setSelectedSupplier] = useState<any>();
  const [isLocationModalOpen, setIsLocationModalOpen] =
    useState<boolean>(false);
  const [isBuyerLocationModalOpen, setIsBuyerLocationModalOpen] =
    useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] =
    useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);

  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);

  const [city, setCity] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(1);
  const [title, setTitle] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [ocNumber, setOcNumber] = useState("");
  const [ocDate, setOcDate] = useState("");
  const [indentNumber, setIndentNumber] = useState("");
  const [indentDate, setIndentDate] = useState("");
  const [amendment, setAmendment] = useState("0");
  const [ocDetails, setOcDetails] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [buyerLocation, setBuyerLocation] = useState<any>(
    JSON.parse(localStorage.getItem("selectedBuyerLocation") || "null")
  );
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

  // Validation state
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

  const [deliveryLocation, setDeliveryLocation] = useState<any>(
    JSON.parse(localStorage.getItem("selectedDeliveryLocation") || "null")
  );

  // Clear specific field error when user starts typing/selecting
  const clearFieldError = (fieldName: keyof ValidationErrors) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate required fields
    if (!selectedBuyer) {
      newErrors.selectedBuyer = "Buyer selection is required";
    }

    if (!selectedSupplier) {
      newErrors.selectedSupplier = "Supplier selection is required";
    }

    if (!deliveryLocation) {
      newErrors.deliveryAddress = "Delivery location is required";
    }

    if (!buyerLocation) {
      newErrors.billingAddress = "Buyer location is required";
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

    if (!ocNumber.trim()) {
      newErrors.ocNumber = "Order confirmation number is required";
    }

    if (!ocDate.trim()) {
      newErrors.ocDate = "Order confirmation date is required";
    }

    if (!indentNumber.trim()) {
      newErrors.indentNumber = "Indent number is required";
    }

    if (!indentDate.trim()) {
      newErrors.indentDate = "Indent date is required";
    }

    if (!amendment.trim()) {
      newErrors.amendment = "Amendment is required";
    }

    if (!ocDetails.trim()) {
      newErrors.ocDetails = "Order confirmation details are required";
    }

    if (!warehouseId) {
      newErrors.warehouseId = "Warehouse selection is required";
    }

    if (!emailRecipients.trim()) {
      newErrors.emailRecipients = "Email recipients are required";
    }

    // Validate items
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
    const supplier = localStorage.getItem("selectedSupplier");
    if (supplier) setSelectedSupplier(JSON.parse(supplier));

    // const buyer = localStorage.getItem("selectedBuyer");
    // if (buyer) setSelectedBuyer(JSON.parse(buyer));
  }, []);

  const handleSelectLocation = (location: any) => {
    setDeliveryLocation(location);
    setIsLocationModalOpen(false);
    clearFieldError("deliveryAddress");
  };

  const handleSelectBuyerLocation = (location: any) => {
    setBuyerLocation(location);
    setIsBuyerLocationModalOpen(false);
    localStorage.setItem("selectedBuyerLocation", JSON.stringify(location));
    clearFieldError("billingAddress");
  };

  useEffect(() => {
    console.log("warehouseId updated:", warehouseId);
  }, [warehouseId]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await get(`/inventory/purchase-order`);
        if (data?.status) {
          console.log("Fetched items:", data.data);

          // Calculate maximum numbers and set them with prefixes
          if (data.data && data.data.length > 0) {
            // Extract numeric parts from existing prefixed strings
            const maxDocumentNumber = Math.max(
              ...data.data.map((item: any) => {
                const docNum =
                  item.documentNumber?.toString().replace(/^DOC-0*/, "") || "0";
                return parseInt(docNum) || 0;
              })
            );
            const maxOcNumber = Math.max(
              ...data.data.map((item: any) => {
                const ocNum =
                  item.ocNumber?.toString().replace(/^OC-0*/, "") || "0";
                return parseInt(ocNum) || 0;
              })
            );
            const maxIndentNumber = Math.max(
              ...data.data.map((item: any) => {
                const indentNum =
                  item.indentNumber?.toString().replace(/^IND-0*/, "") || "0";
                return parseInt(indentNum) || 0;
              })
            );

            // Format with prefixes and zero padding
            const nextDocNumber = (maxDocumentNumber + 1)
              .toString()
              .padStart(2, "0");
            const nextOcNumber = (maxOcNumber + 1).toString().padStart(2, "0");
            const nextIndentNumber = (maxIndentNumber + 1)
              .toString()
              .padStart(2, "0");
            setDocumentNumber(`DOC-00${nextDocNumber}`);
            setOcNumber(`OC-00${nextOcNumber}`);
            setIndentNumber(`IND-00${nextIndentNumber}`);

            console.log("Next Document Number:", `DOC-00${nextDocNumber}`);
            console.log("Next OC Number:", `OC-00${nextOcNumber}`);
            console.log("Next Indent Number:", `IND-00${nextIndentNumber}`);
          } else {
            // If no data, start with 01
            setDocumentNumber("DOC-01");
            setOcNumber("OC-01");
            setIndentNumber("IND-01");
          }
        }
      } catch (error) {
        console.error("Failed to fetch items", error);
        // Set default values in case of error
        setDocumentNumber("DOC-01");
        setOcNumber("OC-01");
        setIndentNumber("IND-01");
      }
    };
    fetchItems();
  }, []);
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const result = await get(`/inventory/warehouse`);
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
      const processedItems = items.map(({ itemId, ...rest }) => ({
        id: itemId,
        unitPrice: rest.price,
        totalPrice: Number(rest.price) * Number(rest.quantity),
        quantity: Number(rest.quantity),
        tax: Number(rest.tax),
      }));

      const payload = {
        supplierId: selectedSupplier.id,
        totalAmount: totalAfterTax,
        remark: remarks,
        city,
        state: stateId,
        country: countryId,
        title,
        documentNumber,
        documentDate,
        amendment,
        ocNumber,
        ocDate,
        indentNumber,
        indentDate,
        warehouse: warehouseId,
        ocDetails,
        signature: selectedBuyer?.name || "",
        items: processedItems,
        grnTime: new Date().toISOString(),
        billingAddress: buyerLocation.id,
        deliveryAddress: deliveryLocation.id,
      };

      const data = await post(`/inventory/purchase-order`, payload);

      if (data?.data?.status === "PENDING") {
        SuccessToast({
          title: "Purchase order submitted successfully.",
          description: "",
        });
        navigate("/sales-purchase");
      } else {
        ErrorToast({
          title: "Failed to submit purchase order",
          description: "",
        });
      }
    } catch (err: any) {
      console.error("Failed to create order:", err);
      ErrorToast({
        title: "Failed to create order",
        description: err?.message?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="flex flex-col h-fill justify-between space-y-6">
          {/* Buyer and details Card */}
          <div className="border-[1.5px] h-[50%] rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Buyers Details</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
                onClick={() => setIsBuyerLocationModalOpen(true)}
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">
                {selectedBuyer?.company?.name || ""}
              </div>
              <div className="font-medium">
                {selectedBuyer?.companyName || ""}
              </div>

              <div className="font-medium">
                {" "}
                Contact Person: {selectedBuyer?.name}{" "}
              </div>
              <div className="font-medium">
                {" "}
                Phone: +91 {selectedBuyer?.phone}{" "}
              </div>

              {buyerLocation ? (
                <div>
                  <p className="font-medium">{buyerLocation.locationName}</p>
                  <p>{buyerLocation.address1}</p>
                  {buyerLocation.address2 && <p>{buyerLocation.address2}</p>}
                  <p>
                    {buyerLocation.city}, {buyerLocation.state},{" "}
                    {buyerLocation.country} - {buyerLocation.postalCode}
                  </p>
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                    {buyerLocation.gstin}
                  </p>
                </div>
              ) : (
                <p></p>
              )}
            </div>
            {errors.selectedBuyer && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.selectedBuyer}</p>
              </div>
            )}

            {errors.billingAddress && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.billingAddress}</p>
              </div>
            )}
          </div>
          {/* Suppliers details Card */}
          <div className="border-[1.5px] h-[50%] rounded-lg border-neutral-200 text-sm">
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
        <div className="flex flex-col w-full justify-between space-y-6">
          {/* Delivery Location Card */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Delivery Location</h4>
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
              {deliveryLocation ? (
                <div>
                  <p className="font-medium">{deliveryLocation.locationName}</p>
                  <p>{deliveryLocation.address1}</p>
                  {deliveryLocation.address2 && (
                    <p>{deliveryLocation.address2}</p>
                  )}
                  <p>
                    {deliveryLocation.city}, {deliveryLocation.state},{" "}
                    {deliveryLocation.country} - {deliveryLocation.postalCode}
                  </p>
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                    {deliveryLocation.gstin}
                  </p>
                </div>
              ) : (
                <p>No delivery location selected</p>
              )}
            </div>
            {errors.deliveryAddress && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">{errors.deliveryAddress}</p>
              </div>
            )}
          </div>
          {/* Place of Supply Card */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
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
          {/* Place of Supply form */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
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
                  <Label className={labelClasses} htmlFor="ocNumber">
                    Order Confirmation Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.ocNumber ? "border-red-500" : ""
                    }`}
                    placeholder="Oc Number"
                    name="ocNumber"
                    value={ocNumber}
                    onChange={(e) => {
                      setOcNumber(e.target.value);
                      clearFieldError("ocNumber");
                    }}
                  />
                  {errors.ocNumber && (
                    <p className="text-red-500 text-xs">{errors.ocNumber}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="ocDate">
                    Order Confirmation Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="ocDate"
                    onChange={(dateString) => {
                      setOcDate(dateString);
                      clearFieldError("ocDate");
                    }}
                  />
                  {errors.ocDate && (
                    <p className="text-red-500 text-xs">{errors.ocDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="indentNumber">
                    Indent Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.indentNumber ? "border-red-500" : ""
                    }`}
                    placeholder="Indent Number"
                    name="indentNumber"
                    value={indentNumber}
                    onChange={(e) => {
                      setIndentNumber(e.target.value);
                      clearFieldError("indentNumber");
                    }}
                  />
                  {errors.indentNumber && (
                    <p className="text-red-500 text-xs">
                      {errors.indentNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="indentDate">
                    Indent Date <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="indentDate"
                    onChange={(dateString) => {
                      setIndentDate(dateString);
                      clearFieldError("indentDate");
                    }}
                  />
                  {errors.indentDate && (
                    <p className="text-red-500 text-xs">{errors.indentDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="amendment">
                    Amendment <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.amendment ? "border-red-500" : ""
                    }`}
                    placeholder="Amendment"
                    name="amendment"
                    id="amendment"
                    value={amendment}
                    disabled={true}
                    onChange={(e) => {
                      setAmendment(e.target.value);
                      clearFieldError("amendment");
                    }}
                  />
                  {errors.amendment && (
                    <p className="text-red-500 text-xs">{errors.amendment}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="ocDetails">
                    Order Confirmation Details{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${
                      errors.ocDetails ? "border-red-500" : ""
                    }`}
                    placeholder="Order Confirmation Details"
                    name="ocDetails"
                    id="ocDetails"
                    value={ocDetails}
                    onChange={(e) => {
                      setOcDetails(e.target.value);
                      clearFieldError("ocDetails");
                    }}
                  />
                  {errors.ocDetails && (
                    <p className="text-red-500 text-xs">{errors.ocDetails}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between gap-2">
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
                    <p className="text-red-500 text-xs">{errors.warehouseId}</p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <PurchaseOrdertable
          toggleAddItemModal={() => setShowAddItemModal((prev) => !prev)}
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
      {/* Fields form and summary */}
      <div className="flex mt-8 md:mt-10 lg:mt-16 justify-between flex-col md:flex-row gap-5">
        <div className="w-full max-w-96 text-sm space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="emailRecipients">
                Email Recipients <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                className={`${inputClasses} ${
                  errors.emailRecipients ? "border-red-500" : ""
                }`}
                name="emailRecipients"
                value={emailRecipients}
                onChange={(e) => {
                  setEmailRecipients(e.target.value);
                  clearFieldError("emailRecipients");
                }}
                placeholder="Enter email addresses"
              />
              {errors.emailRecipients && (
                <p className="text-red-500 text-xs">{errors.emailRecipients}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="remarks">
                Remark(s)
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
          <Button
            className="mt-4 bg-[#7047EB] text-white hover:bg-[#5a36b8] focus:ring-2 focus:ring-[#7047EB] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="secondary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Purchase Order"}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <ShowBuyers
        isOpen={showBuyersModal}
        onClose={() => setShowBuyersModal(false)}
        onSelectBuyer={(buyer: any) => {
          localStorage.setItem("selectedBuyer", JSON.stringify(buyer));
          setSelectedBuyer(buyer);
          clearFieldError("selectedBuyer");
        }}
      />

      <ShowSuppliers
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
        onSelectSupplier={(supplier: any) => {
          localStorage.setItem("selectedSupplier", JSON.stringify(supplier));
          setSelectedSupplier(supplier);
          clearFieldError("selectedSupplier");
        }}
      />

      <ShowLocations
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
      />

      <ShowLocations
        isOpen={isBuyerLocationModalOpen}
        onClose={() => setIsBuyerLocationModalOpen(false)}
        onSelectLocation={handleSelectBuyerLocation}
      />

      <AddWarehouseModal
        isOpen={showAddWarehouseModal}
        onClose={toggleAddWarehouseModal}
      />
      <AddPurchaseItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal((prev) => !prev)}
      />
    </div>
  );
};

export default PurchaseOrder;

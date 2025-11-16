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
import ShowLocations from "@/components/app/modals/ShowLocations";
import AddWarehouseModal from "@/components/app/modals/AddWarehouseModal";
import InputDatePicker from "@/components/app/InputDatePicker";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import {get,post} from "../../lib/apiService"

export type warehouse = {
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

export type ValidationErrors = {
  selectedBuyer?: string;
  deliveryLocation?: string;
  placeOfSupplyCity?: string;
  placeOfSupplyState?: string;
  placeOfSupplyCountry?: string;
  documentNumber?: string;
  documentDate?: string;
  customerEnquiryNumber?: string;
  customerEnquiryDate?: string;
  expectedReplyDate?: string;
  warehouseId?: string;
  items?: string;
};

import { useNavigate } from "react-router";
import AddPurchaseItemModal from "@/components/app/modals/AddPurchaseItemModal";
import SalesOrderTable from "@/components/app/tables/sales-purchase/SalesOrderTable";

const SalesOrder: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<warehouse[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [showBuyersModal, setShowBuyersModal] = useState<boolean>(false);
  const [selectedBuyer, setSelectedBuyer] = useState<any>();
  const [isLocationModalOpen, setIsLocationModalOpen] =
    useState<boolean>(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] =
    useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);

  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);

  const [placeOfSupplyCity, setPlaceOfSupplyCity] = useState("");
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState<number | null>(
    null,
  );
  const [placeOfSupplyCountry, setPlaceOfSupplyCountry] = useState<
    number | null
  >(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [customerEnquiryNumber, setCustomerEnquiryNumber] = useState("");
  const [customerEnquiryDate, setCustomerEnquiryDate] = useState("");
  const [expectedReplyDate, setExpectedReplyDate] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
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
    JSON.parse(localStorage.getItem("selectedDeliveryLocation") || "null"),
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

    if (!deliveryLocation) {
      newErrors.deliveryLocation = "Delivery location is required";
    }

    if (!placeOfSupplyCity.trim()) {
      newErrors.placeOfSupplyCity = "Place of supply city is required";
    }

    if (!placeOfSupplyState) {
      newErrors.placeOfSupplyState = "Place of supply state is required";
    }

    if (!placeOfSupplyCountry) {
      newErrors.placeOfSupplyCountry = "Place of supply country is required";
    }

    if (!documentNumber.trim()) {
      newErrors.documentNumber = "Document number is required";
    }

    if (!documentDate.trim()) {
      newErrors.documentDate = "Document date is required";
    }

    if (!customerEnquiryNumber.trim()) {
      newErrors.customerEnquiryNumber = "Customer enquiry number is required";
    }

    if (!customerEnquiryDate.trim()) {
      newErrors.customerEnquiryDate = "Customer enquiry date is required";
    }

    if (!expectedReplyDate.trim()) {
      newErrors.expectedReplyDate = "Expected reply date is required";
    }

    if (!warehouseId) {
      newErrors.warehouseId = "Warehouse selection is required";
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
    const buyer = localStorage.getItem("selectedBuyer");
    if (buyer) setSelectedBuyer(JSON.parse(buyer));
  }, []);

  const handleSelectLocation = (location: any) => {
    setDeliveryLocation(location);
    setIsLocationModalOpen(false);
    clearFieldError("deliveryLocation");
  };

  useEffect(() => {
    console.log("warehouseId updated:", warehouseId);
  }, [warehouseId]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await get(`/inventory/sales-inquiry`);
        if (data?.status) {
          console.log("Fetched items:", data.data);

          if (data.data && data.data.length > 0) {
            const maxDocumentNumber = Math.max(
              ...data.data.map((item: any) => {
                const docNum =
                  item.documentNumber?.toString().replace(/^DOC-0*/, "") || "0";
                return parseInt(docNum) || 0;
              }),
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
        quantity: Number(rest.quantity),
        unitPrice: rest.price,
        totalPrice: Number(rest.price) * Number(rest.quantity),
        tax: Number(rest.tax),
      }));

      const payload = {
        buyerId: selectedBuyer.id,
        totalAmount: totalAfterTax,
        tax: totalTax,
        warehouseId: warehouseId,
        items: processedItems,
        placeOfSupplyCity: placeOfSupplyCity,
        placeOfSupplyState: placeOfSupplyState,
        placeOfSupplyCountry: placeOfSupplyCountry,
        documentNumber: documentNumber,
        documentDate: new Date(documentDate).toISOString(),
        customerEnquiryNumber: customerEnquiryNumber,
        customerEnquiryDate: new Date(customerEnquiryDate).toISOString(),
        expectedReplyDate: new Date(expectedReplyDate).toISOString(),
        createdById: 1, // You may want to get this from user context
        companyId: 1, // You may want to get this from user/company context
      };

      console.log("Payload:", payload);

    

      const data = await post("/inventory/sales-inquiry", payload);
      console.log("Sales order created:", data);

      SuccessToast({
        title: "Sales order submitted successfully.",
        description: "",
      });
      navigate("/sales-purchase");
    } catch (err: any) {
      console.error("Failed to create sales order:", err);
      ErrorToast({
        title: "Failed to create sales order",
        description: err?.message?.message || err?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="flex flex-col h-fill justify-between space-y-6">
          {/* Buyer details Card */}
          <div className="border-[1.5px] h-[50%] rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Buyer Details</h4>
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

          {/* Delivery Location Card */}
          <div className="border-[1.5px] h-[50%] rounded-lg border-neutral-200 text-sm">
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
            {errors.deliveryLocation && (
              <div className="px-3 pb-2">
                <p className="text-red-500 text-xs">
                  {errors.deliveryLocation}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full justify-between space-y-6">
          {/* Place of Supply Card */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Place Of Supply</h4>
            </div>
            <div className="px-3 py-2 space-y-3">
            
              <div className="grid grid-cols-2 gap-2">
               
                <div className="space-y-2">
                  <Label
                    className={labelClasses}
                    htmlFor="placeOfSupplyCountry"
                  >
                    Country <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="placeOfSupplyCountry"
                    value={placeOfSupplyCountry?.toString() || ""}
                    onValueChange={(value) => {
                      setPlaceOfSupplyCountry(Number(value));
                      clearFieldError("placeOfSupplyCountry");
                    }}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${errors.placeOfSupplyCountry ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Country">
                        {countries.find((c) => c.id === placeOfSupplyCountry)
                          ?.name || ""}
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
                  {errors.placeOfSupplyCountry && (
                    <p className="text-red-500 text-xs">
                      {errors.placeOfSupplyCountry}
                    </p>
                  )}
                </div>

                 <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="placeOfSupplyState">
                    State <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select
                    name="placeOfSupplyState"
                    value={placeOfSupplyState?.toString() || ""}
                    onValueChange={(value) => {
                      setPlaceOfSupplyState(Number(value));
                      clearFieldError("placeOfSupplyState");
                    }}
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full ${errors.placeOfSupplyState ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="State">
                        {states.find((s) => s.id === placeOfSupplyState)?.name || ""}
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
                  {errors.placeOfSupplyState && (
                    <p className="text-red-500 text-xs">{errors.placeOfSupplyState}</p>
                  )}
                </div>
              </div>

                <div className="space-y-2">
                <Label className={labelClasses} htmlFor="placeOfSupplyCity">
                  City <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={`${inputClasses} ${errors.placeOfSupplyCity ? "border-red-500" : ""}`}
                  placeholder="City"
                  name="placeOfSupplyCity"
                  value={placeOfSupplyCity}
                  onChange={(e) => {
                    setPlaceOfSupplyCity(e.target.value);
                    clearFieldError("placeOfSupplyCity");
                  }}
                />
                {errors.placeOfSupplyCity && (
                  <p className="text-red-500 text-xs">{errors.placeOfSupplyCity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Warehouse</h4>
            </div>
            <div className="px-3 py-2 space-y-3">
              <div className="space-y-2">
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
                    className={`${inputClasses} w-full ${errors.warehouseId ? "border-red-500" : ""}`}
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
          </div>
        </div>

        <div>
          {/* Order Details form */}
          <div className="border-[1.5px] h-full rounded-lg border-neutral-200 text-sm">
            <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Order Details</h4>
            </div>
            <form className="space-y-2 px-4 py-3 ">
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="documentNumber">
                    Document Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${errors.documentNumber ? "border-red-500" : ""}`}
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
                  <Label
                    className={labelClasses}
                    htmlFor="customerEnquiryNumber"
                  >
                    Customer Enquiry Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={`${inputClasses} ${errors.customerEnquiryNumber ? "border-red-500" : ""}`}
                    placeholder="Customer Enquiry Number"
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

                <div className="space-y-2 md:col-span-2">
                  <Label className={labelClasses} htmlFor="expectedReplyDate">
                    Expected Reply Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <InputDatePicker
                    name="expectedReplyDate"
                    onChange={(dateString) => {
                      setExpectedReplyDate(dateString);
                      clearFieldError("expectedReplyDate");
                    }}
                  />
                  {errors.expectedReplyDate && (
                    <p className="text-red-500 text-xs">
                      {errors.expectedReplyDate}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <SalesOrderTable
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
            {isSubmitting ? "Submitting..." : "Submit Sales Order"}
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

      {/* <ShowSuppliers
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
        onSelectSupplier={(supplier: any) => {
          localStorage.setItem("selectedSupplier", JSON.stringify(supplier));
          setSelectedSupplier(supplier);
          clearFieldError("selectedSupplier");
        }}
      /> */}

      <ShowLocations
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={handleSelectLocation}
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

export default SalesOrder;

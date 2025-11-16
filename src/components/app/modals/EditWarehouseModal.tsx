import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import React, { useRef, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import { get, put } from "../../../lib/apiService";

interface EditWarehouseModalProps extends IModalProps {
  data: any;
  onSuccess?: () => void; // Callback to refresh table
}

const EditWarehouseModal: React.FC<EditWarehouseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  data,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Updated controlled input state to match API structure
  const [warehouseName, setWarehouseName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [countryId, setCountryId] = useState<number | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Error state
  const [errors, setErrors] = useState({
    warehouseName: "",
    address1: "",
    city: "",
    stateId: "",
    countryId: "",
    postalCode: "",
  });

  // Initialize form with data when modal opens or data changes
  useEffect(() => {
    if (data && isOpen) {
      setWarehouseName(data.name || "");
      setAddress1(data.address1 || "");
      setAddress2(data.address2 || "");
      setCity(data.city || "");
      setStateId(data.state?.id || data.stateId || null);
      setCountryId(data.country?.id || data.countryId || null);
      setPostalCode(data.postalCode || "");
      // Clear any previous errors
      setErrors({
        warehouseName: "",
        address1: "",
        city: "",
        stateId: "",
        countryId: "",
        postalCode: "",
      });
    }
  }, [data, isOpen]);

  // Fetch states and countries when modal opens
  useEffect(() => {
    const fetchStatesAndCountries = async () => {
      try {
        const statesResult = await get("/state/1");
        setStates(statesResult.data);
      } catch (error) {
        console.error("Error fetching states:", error);
        ErrorToast({
          title: "Error",
          description: "Failed to fetch states",
        });
      }

      try {
        const countriesResult = await get("/countrie");
        setCountries(countriesResult.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
        ErrorToast({
          title: "Error",
          description: "Failed to fetch countries",
        });
      }
    };

    if (isOpen) {
      fetchStatesAndCountries();
    }
  }, [isOpen]);

  const validateFields = () => {
    const newErrors = {
      warehouseName: "",
      address1: "",
      city: "",
      stateId: "",
      countryId: "",
      postalCode: "",
    };

    if (!warehouseName.trim()) {
      newErrors.warehouseName = "Warehouse Name is required";
    }

    if (!address1.trim()) {
      newErrors.address1 = "Address 1 is required";
    }

    if (!city.trim()) {
      newErrors.city = "City is required";
    }

    if (!stateId) {
      newErrors.stateId = "State is required";
    }

    if (!countryId) {
      newErrors.countryId = "Country is required";
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = "Postal Code is required";
    } else if (!/^\d{6}$/.test(postalCode.trim())) {
      newErrors.postalCode = "Postal code must be exactly 6 digits";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    const payload = {
      name: warehouseName,
      address1: address1,
      address2: address2,
      city: city,
      state: stateId,
      country: countryId,
      postalCode: postalCode,
    };

    try {
      setIsLoading(true);
      const result = await put(`/inventory/warehouse/${data.id}`, payload);
      
      console.log("Warehouse updated:", result);
      SuccessToast({
        title: "Success",
        description: "Warehouse updated successfully",
      });
      onSuccess?.(); // Trigger table refresh
      onClose();
    } catch (error: any) {
      ErrorToast({
        title: "Error",
        description: error?.message || "Failed to update warehouse",
      });
      console.error("Error updating warehouse:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    switch (field) {
      case "warehouseName":
        setWarehouseName(value as string);
        break;
      case "address1":
        setAddress1(value as string);
        break;
      case "address2":
        setAddress2(value as string);
        break;
      case "city":
        setCity(value as string);
        break;
      case "stateId":
        setStateId(value as number | null);
        break;
      case "countryId":
        setCountryId(value as number | null);
        break;
      case "postalCode":
        // Only allow digits and limit to 6 characters
        const numericValue = (value as string).replace(/\D/g, "").slice(0, 6);
        setPostalCode(numericValue);
        break;
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-50 p-10 py-16">
      <div
        className="bg-white rounded-lg w-full max-h-[70dvh] md:max-h-[85dvh] max-w-xl overflow-y-auto pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 bg-neutral-100/90 rounded-t-lg py-4 flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-lg font-semibold">Edit Warehouse</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleClose}
                variant="outline"
                className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#7047EB] text-xs sm:text-sm h-7 sm:h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="warehouseName">
                Name<span className="text-[#F53D6B] ml-1">*</span>
              </Label>
              <Input
                id="warehouseName"
                name="name"
                className={`${inputClasses} w-full ${errors.warehouseName ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="eg: Main Warehouse"
                value={warehouseName}
                onChange={(e) =>
                  handleInputChange("warehouseName", e.target.value)
                }
                disabled={isLoading}
              />
              {errors.warehouseName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.warehouseName}
                </p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="address1">
                Address 1<span className="text-[#F53D6B] ml-1">*</span>
              </Label>
              <Input
                id="address1"
                name="address1"
                className={`${inputClasses} w-full ${errors.address1 ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="eg: 123 Main Street"
                value={address1}
                onChange={(e) =>
                  handleInputChange("address1", e.target.value)
                }
                disabled={isLoading}
              />
              {errors.address1 && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address1}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="address2">
                Address 2
              </Label>
              <Input
                id="address2"
                name="address2"
                className={`${inputClasses} w-full`}
                placeholder="eg: Apartment, suite, etc."
                value={address2}
                onChange={(e) =>
                  handleInputChange("address2", e.target.value)
                }
                disabled={isLoading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="city">
                  City<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  className={`${inputClasses} w-full ${errors.city ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="eg: New York"
                  value={city}
                  onChange={(e) =>
                    handleInputChange("city", e.target.value)
                  }
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="stateId">
                  State <span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Select
                  name="stateId"
                  value={stateId !== null ? stateId.toString() : ""}
                  onValueChange={(value) => {
                    handleInputChange("stateId", value ? Number(value) : null);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${errors.stateId ? "border-red-500 focus:border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map((state) => (
                        <SelectItem value={state.id.toString()} key={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.stateId && (
                  <p className="text-red-500 text-xs mt-1">{errors.stateId}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="countryId">
                  Country <span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Select
                  name="countryId"
                  value={countryId !== null ? countryId.toString() : ""}
                  onValueChange={(value) => {
                    handleInputChange(
                      "countryId",
                      value ? Number(value) : null,
                    );
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${errors.countryId ? "border-red-500 focus:border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Select Country" />
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
                  <p className="text-red-500 text-xs mt-1">
                    {errors.countryId}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="postalCode">
                  Postal Code<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  className={`${inputClasses} w-full ${errors.postalCode ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="eg: 110001"
                  value={postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
                  disabled={isLoading}
                  maxLength={6}
                  inputMode="numeric"
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.postalCode}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWarehouseModal
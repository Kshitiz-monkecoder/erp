import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
// import { IModalProps } from "@/lib/types";
import React, { useRef, useState, useEffect } from "react";
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
import {post,get} from "../../../lib/apiService"


const AddWarehouseModal: React.FC<any> = ({ isOpen, onClose,onSuccess }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Controlled input state
  const [name, setName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  // Error state
  const [errors, setErrors] = useState({
    name: "",
    address1: "",
    city: "",
    stateId: "",
    countryId: "",
    postalCode: "",
  });

  const validateFields = () => {
    const newErrors = {
      name: "",
      address1: "",
      city: "",
      stateId: "",
      countryId: "",
      postalCode: "",
    };

    if (!name.trim()) {
      newErrors.name = "Warehouse name is required";
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
      newErrors.postalCode = "Postal code is required";
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

    const userObj = JSON.parse(localStorage.getItem("user") || "{}");
    const payload = {
      name,
      address1,
      address2,
      city,
      state: stateId,
      postalCode,
      country: countryId,
      user: [{ id: userObj.id }],
    };

    try {
   

      const result = await post("/inventory/warehouse",payload);

      if (result.status) {
        console.log("Warehouse created:", result);
        SuccessToast({
          title: "Success",
          description: "Warehouse created successfully",
        });
        // Reset form
        setName("");
        setAddress1("");
        setAddress2("");
        setCity("");
        setStateId(null);
        setPostalCode("");
        setCountryId(null);
        setErrors({
          name: "",
          address1: "",
          city: "",
          stateId: "",
          countryId: "",
          postalCode: "",
        });
        onSuccess?.();
        onClose();
      } else {
        ErrorToast({
          title: "Error",
          description: result?.message?.message || "Failed to create warehouse",
        });
        console.error("Error creating warehouse:", result);
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Failed to create warehouse",
      });
      console.error("Request error:", err);
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    switch (field) {
      case "name":
        setName(value as string);
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

  useEffect(() => {
    const fetchStatesAndCountries = async () => {
      try {
        const result = await get("/state/1");
        setStates(result.data);
      } catch (error) {
        console.error("Error fetching states :", error);
        ErrorToast({
          title: "Error",
          description: "Failed to fetch states",
        });
      }

      try {
        const result = await get("/countrie");
        setCountries(result.data);

        // Set India as default country if available
        const indiaCountry = result.data.find((country: any) =>
          country.name.toLowerCase().includes("india"),
        );
        if (indiaCountry && !countryId) {
          setCountryId(indiaCountry.id);
        }
      } catch (error) {
        console.error("Error fetching countries :", error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-50 p-10 py-16">
      <div
        className="bg-white rounded-lg w-full max-h-[70dvh] md:max-h-[85dvh] max-w-xl overflow-y-auto pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="px-6 bg-neutral-100/90 rounded-t-lg py-4 flex items-center justify-between gap-3">
            <h3 className="text-sm sm:text-lg font-semibold">Add Warehouse</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#7047EB] text-xs sm:text-sm h-7 sm:h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
              >
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="name">
                Name<span className="text-[#F53D6B] ml-1">*</span>
              </Label>
              <Input
                id="name"
                className={`${inputClasses} w-full ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="eg: Main Warehouse"
                value={name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="address1">
                  Address 1<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Textarea
                  id="address1"
                  className={`${inputClasses} w-full max-h-32 ${errors.address1 ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="Address 1"
                  value={address1}
                  onChange={(e) =>
                    handleInputChange("address1", e.target.value)
                  }
                />
                {errors.address1 && (
                  <p className="text-red-500 text-xs mt-1">{errors.address1}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="address2">
                  Address 2
                </Label>
                <Textarea
                  id="address2"
                  className={`${inputClasses} w-full max-h-32`}
                  placeholder="Address 2"
                  value={address2}
                  onChange={(e) =>
                    handleInputChange("address2", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="city">
                  City<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input
                  id="city"
                  className={`${inputClasses} w-full ${errors.city ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="City"
                  value={city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
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
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${errors.stateId ? "border-red-500 focus:border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="State" />
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
                >
                  <SelectTrigger
                    className={`${inputClasses} w-full ${errors.countryId ? "border-red-500 focus:border-red-500" : ""}`}
                  >
                    <SelectValue placeholder="Country" />
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
                  className={`${inputClasses} w-full ${errors.postalCode ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="110001"
                  value={postalCode}
                  onChange={(e) =>
                    handleInputChange("postalCode", e.target.value)
                  }
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

export default AddWarehouseModal;

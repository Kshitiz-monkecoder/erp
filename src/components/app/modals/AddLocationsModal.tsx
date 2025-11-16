import React, { useRef, useEffect, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { get, post } from "../../../lib/apiService";
interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationAdded?: (location: any) => void;
  clientId?: number; // Optional clientId for adding location under specific client
  addressType: "billing" | "shipping"; // Required from parent
}

interface LocationFormData {
  companyName: string;
  locationName: string;
  gstinType: string;
  gstin: string;
  address1: string;
  address2: string;
  postalCode: string;
  city: string;
  state: number;
  country: number;
  isBillingSame: boolean;
  billingAddressName: string;
  createdBy: number;
  clientId?: number;
  addressType: string;
}

const AddLocationsModal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  onLocationAdded,
  clientId,
  addressType, // Received from parent
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [errors, setErrors] = useState<Partial<LocationFormData>>({});
  const [apiError, setApiError] = useState<string>("");

  const [formData, setFormData] = useState<LocationFormData>({
    companyName: "",
    locationName: "",
    gstinType: "Regular",
    gstin: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    state: 1, // Initialize as empty string
    country: 1, // Initialize as empty string
    isBillingSame: true,
    billingAddressName: "",
    createdBy: 1,
    clientId: clientId,
    addressType: addressType, // Set from parent
  });

  // Fetch states and countries
  useEffect(() => {
    const fetchStatesAndCountries = async () => {
      try {
        const statesResult = await get("/state/1");
        console.log("States fetched:", statesResult.data);
        setStates(statesResult.data || []);

        // Set default state if available
        if (statesResult.data && statesResult.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            state: statesResult.data[0].id,
          }));
        }
      } catch (error) {
        console.error("Error fetching states:", error);
      }

      try {
        const countriesResult = await get("/countrie");
        console.log("Countries fetched:", countriesResult.data);
        setCountries(countriesResult.data || []);

        // Set default country if available
        if (countriesResult.data && countriesResult.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            country: countriesResult.data[0].id,
          }));
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    if (isOpen) {
      fetchStatesAndCountries();
      // Reset form when modal opens, but keep addressType from parent
      setFormData({
        companyName: "",
        locationName: "",
        gstinType: "Regular",
        gstin: localStorage.getItem("currentB&S")
          ? JSON.parse(localStorage.getItem("currentB&S")!).gstNumber
          : "",
        address1: "",
        address2: "",
        postalCode: "",
        city: "",
        state: 1,
        country: 1,
        isBillingSame: true,
        billingAddressName: "",
        createdBy: 1,
        clientId: clientId,
        addressType: addressType, // Always use parent's addressType
      });
      // Clear errors when modal opens
      setErrors({});
      setApiError("");
    }
  }, [isOpen, clientId, addressType]);

  const handleInputChange = (field: keyof LocationFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LocationFormData> = {};

    // Required field validations
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company Name is required";
    }
    if (!formData.locationName.trim()) {
      newErrors.locationName = "Location Name is required";
    }
    if (!formData.gstin.trim()) {
      newErrors.gstin = "GSTIN is required";
    }
    if (!formData.address1.trim()) {
      newErrors.address1 = "Address Line 1 is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal Code is required";
    }
    if (!formData.state) {
      newErrors.state = 0;
    }
    if (!formData.country) {
      newErrors.country = 0;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Console log before submission
    console.log("Form data before submission:", formData);

    // Validate form before submitting
    if (!validateForm()) {
      console.log("Form validation failed:", errors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await post("/locations", formData);
      console.log("Location added successfully:", result);

      if (result.status) {
        SuccessToast({
          title: "Location added successfully.",
          description: "",
        });
        onLocationAdded?.(result.data || result);
        onClose();
      } else {
        const errorData =
          result?.error?.message || result?.error || result?.message || result;
        console.error("Error adding location:", errorData);
        ErrorToast({
          title: errorData?.message || "An error occurred",
          description: "",
        });
        setApiError(
          errorData.message || "Failed to add location. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error adding location:", error);
      ErrorToast({
        title: error?.message || "An error occurred",
        description: "",
      });
      setApiError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Capitalize first letter for display
  const addressTypeDisplay =
    addressType.charAt(0).toUpperCase() + addressType.slice(1);

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between sticky top-0">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Add New {addressTypeDisplay} Location
          </h4>
          <X className="text-[#8A8AA3] cursor-pointer w-5" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* API Error Message - Fixed height to prevent UI shift */}
          <div className="min-h-[20px]">
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{apiError}</p>
              </div>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="companyName">
              Company Name <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Input
              id="companyName"
              type="text"
              className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                errors.companyName ? "border-red-500" : ""
              }`}
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
            )}
          </div>

          {/* Location Name */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="locationName">
              Location Name <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Input
              id="locationName"
              type="text"
              className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                errors.locationName ? "border-red-500" : ""
              }`}
              value={formData.locationName}
              onChange={(e) =>
                handleInputChange("locationName", e.target.value)
              }
              placeholder="Enter location name"
            />
            {errors.locationName && (
              <p className="text-red-500 text-xs mt-1">{errors.locationName}</p>
            )}
          </div>

          {/* GSTIN Type */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="gstinType">
              GSTIN Type <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Select
              value={formData.gstinType}
              onValueChange={(value) => handleInputChange("gstinType", value)}
            >
              <SelectTrigger
                className={`${inputClasses} w-full px-3 py-2 rounded-md`}
              >
                <SelectValue placeholder="Select GSTIN Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Composition">Composition</SelectItem>
                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* GSTIN */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="gstin">
              GSTIN <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Input
              id="gstin"
              type="text"
              className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                errors.gstin ? "border-red-500" : ""
              }`}
              value={formData.gstin}
              onChange={(e) => handleInputChange("gstin", e.target.value)}
              placeholder="Enter GSTIN"
            />
            {errors.gstin && (
              <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>
            )}
          </div>

          {/* Address 1 */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="address1">
              Address Line 1 <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Input
              id="address1"
              type="text"
              className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                errors.address1 ? "border-red-500" : ""
              }`}
              value={formData.address1}
              onChange={(e) => handleInputChange("address1", e.target.value)}
              placeholder="Enter address line 1"
            />
            {errors.address1 && (
              <p className="text-red-500 text-xs mt-1">{errors.address1}</p>
            )}
          </div>

          {/* Address 2 */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="address2">
              Address Line 2
            </Label>
            <Input
              id="address2"
              type="text"
              className={`${inputClasses} w-full px-3 py-2 rounded-md`}
              value={formData.address2}
              onChange={(e) => handleInputChange("address2", e.target.value)}
              placeholder="Enter address line 2"
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="city">
                City <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                  errors.city ? "border-red-500" : ""
                }`}
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="postalCode">
                Postal Code <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                id="postalCode"
                type="text"
                className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                  errors.postalCode ? "border-red-500" : ""
                }`}
                value={formData.postalCode}
                onChange={(e) =>
                  handleInputChange("postalCode", e.target.value)
                }
                placeholder="Enter postal code"
              />
              {errors.postalCode && (
                <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* State and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="state">
                State <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Select
                value={String(formData.state)}
                onValueChange={(value) =>
                  handleInputChange("state", parseInt(value))
                }
              >
                <SelectTrigger
                  className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                    errors.state ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={String(state.id)}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="country">
                Country <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Select
                value={String(formData.country)}
                onValueChange={(value) =>
                  handleInputChange("country", parseInt(value))
                }
              >
                <SelectTrigger
                  className={`${inputClasses} w-full px-3 py-2 rounded-md ${
                    errors.country ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={String(country.id)}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          {/* Address Type - Now read-only, showing parent value */}
          <div className="space-y-1">
            <Label className={labelClasses} htmlFor="addressType">
              Address Type <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <div
              className={`${inputClasses} w-full px-3 py-2 rounded-md bg-neutral-200/70 text-neutral-800 capitalize`}
            >
              {addressType}
            </div>
          </div>

          {/* Is Billing Same Checkbox - Only show for shipping addresses */}
          {addressType === "shipping" && (
            <div className="flex items-center space-x-2">
              <Input
                id="isBillingSame"
                type="checkbox"
                checked={formData.isBillingSame}
                onChange={(e) =>
                  handleInputChange("isBillingSame", e.target.checked)
                }
                className="rounded border-neutral-300 w-3.5"
              />
              <Label htmlFor="isBillingSame" className="text-sm font-medium">
                Same as billing address
              </Label>
            </div>
          )}

          {/* Billing Address Name - Only show for billing addresses */}
          {addressType === "billing" && (
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="billingAddressName">
                Billing Address Name
              </Label>
              <Input
                id="billingAddressName"
                type="text"
                className={`${inputClasses} w-full px-3 py-2 rounded-md`}
                value={formData.billingAddressName}
                onChange={(e) =>
                  handleInputChange("billingAddressName", e.target.value)
                }
                placeholder="Enter billing address name"
              />
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end items-center space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-[#7047EB] text-white rounded-md hover:bg-[#5f3dc4] disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : `Add ${addressTypeDisplay} Location`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationsModal;

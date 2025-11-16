import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import CustomFieldsModal from "@/components/app/modals/CustomFieldsModal";
import CustomFieldsTableModals from "@/components/app/modals/CustomFieldsTableModal";
import AddCompanyTagsModal from "@/components/app/modals/AddCompanyTagsModal";
import DynamicFieldsRenderer from "@/components/app/custom/DynamicBuilder";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import { useNavigate } from "react-router";
import { get, post } from "@/lib/apiService";

export type TagType = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

const AddCompany: React.FC = () => {
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNo: "",
    clientType: "Buyer",
    gstNumber: "",
    gstType: "",
    companyName: "",
    companyEmail: "",
    addressLine1: "",
    addressLine2: "",
    pincode: "",
    city: "",
    state: "",
    country: "India",
    companyReferenceCode: "",
    tags: [] as string[],
    tagIds: [] as number[],
    gstVerified: false,
    customFields: [],
  });

  // Validation errors state
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phoneNo: "",
    clientType: "",
    companyName: "",
    companyEmail: "",
    addressLine1: "",
    pincode: "",
    city: "",
    state: "",
    country: "",
  });

  const [activeTab, setActiveTab] = useState("personDetails");
  const [states, setStates] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState<boolean>(false);
  const [showCustomFieldsTableModal, setShowCustomFieldsTableModal] = useState<boolean>(false);
  const [showCompanyTagsModal, setShowCompanyTagsModal] = useState<boolean>(false);
  const [defaultSelectTags, setDefaultSelectTags] = useState<TagType[]>([]);
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gstVerificationStatus, setGstVerificationStatus] = useState({
    message: "",
    type: "",
  });

  // Helper function for email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate person details tab
  const validatePersonDetails = () => {
    const newErrors = { ...errors };
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
      isValid = false;
    } else {
      newErrors.name = "";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    } else {
      newErrors.email = "";
    }

    // Phone number validation
    if (!formData.phoneNo) {
      newErrors.phoneNo = "Mobile number is required";
      isValid = false;
    } else if (formData.phoneNo.length !== 10) {
      newErrors.phoneNo = "Mobile number must be 10 digits";
      isValid = false;
    } else {
      newErrors.phoneNo = "";
    }

    if (!formData.clientType) {
      newErrors.clientType = "Client type is required";
      isValid = false;
    } else {
      newErrors.clientType = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  // Validate company details tab
  const validateCompanyDetails = () => {
    const newErrors = { ...errors };
    let isValid = true;

    // Company name validation
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
      isValid = false;
    } else {
      newErrors.companyName = "";
    }

    // Company email validation
    if (!formData.companyEmail.trim()) {
      newErrors.companyEmail = "Company email is required";
      isValid = false;
    } else if (!isValidEmail(formData.companyEmail)) {
      newErrors.companyEmail = "Please enter a valid email address";
      isValid = false;
    } else {
      newErrors.companyEmail = "";
    }

    // Address line 1 validation
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address line 1 is required";
      isValid = false;
    } else {
      newErrors.addressLine1 = "";
    }

    // Pincode validation
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
      isValid = false;
    } else {
      newErrors.pincode = "";
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
      isValid = false;
    } else {
      newErrors.city = "";
    }

    // State validation
    if (!formData.state) {
      newErrors.state = "State is required";
      isValid = false;
    } else {
      newErrors.state = "";
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = "Country is required";
      isValid = false;
    } else {
      newErrors.country = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handler to select default tag
  const handleSelectDefaultTag = (value: string) => {
    const id = Number(value);
    setFormData((prev) => {
      if (prev.tagIds.includes(id)) return prev;
      const tag = defaultSelectTags.find((t) => t.id === id);
      return {
        ...prev,
        tagIds: [...prev.tagIds, id],
        tags: tag ? [...prev.tags, tag.name] : prev.tags,
      };
    });
  };

  // Fetch states and countries using API service
  useEffect(() => {
    const fetchStatesAndCountries = async () => {
      try {
        // Fetch states
        const statesResponse = await get("/state/1");
        setStates(statesResponse.data);
      } catch (error) {
        console.error("Error fetching states:", error);
      }

      try {
        // Fetch countries
        const countriesResponse = await get("/countrie");
        setCountries(countriesResponse.data);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchStatesAndCountries();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleRemoveDefaultTag = (id: number) => {
    setFormData((prev) => {
      const tag = defaultSelectTags.find((t) => t.id === id);
      return {
        ...prev,
        tagIds: prev.tagIds.filter((tid) => tid !== id),
        tags: tag ? prev.tags.filter((name) => name !== tag.name) : prev.tags,
      };
    });
  };

  const handleCustomFieldSave = (newField: any) => {
    console.log("New field received:", newField);
  };

  const handleSaveFields = (items: any) => {
    setFormData((prev: any) => ({
      ...prev,
      customFields: items,
    }));

    console.log("Custom fields saved:", items);
    setShowCustomFieldsTableModal(false);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    const numericFields = [""];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));

    // Clear validation error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const toggleCustomFieldsModal = () => setShowCustomFieldsModal((prev) => !prev);

  const toggleCustomFieldsTableModal = () => {
    setShowCustomFieldsTableModal((prev) => !prev);
  };

  const toggleCompanyTagsModal = () => setShowCompanyTagsModal((prev) => !prev);

  const handleSaveAndNext = async () => {
    if (activeTab === "personDetails") {
      if (validatePersonDetails()) {
        setActiveTab("companyDetails");
      }
    } else if (activeTab === "companyDetails") {
      if (validateCompanyDetails()) {
        setActiveTab("otherDetails");
      }
    } else {
      // Submit form using API service
      setIsSubmitting(true);
      try {
        console.log("Form data:", formData);
        await post("/client", formData);

        SuccessToast({
          title: "Company added successfully.",
          description: "",
        });
        navigate("/buyers-suppliers?tab=all");
      } catch (error: any) {
        const errorMessage = error.message || "An error occurred";
        ErrorToast({
          title: "Error:",
          description: errorMessage,
        });
        setError(errorMessage);
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGetDetails = async (gstNumber: string, gstApiSecret: string) => {
    console.log(gstApiSecret, gstNumber);

    // Clear previous status messages
    setGstVerificationStatus({ message: "", type: "" });

    if (!gstNumber) {
      setGstVerificationStatus({
        message: "Please enter a GST number",
        type: "error",
      });
      return;
    }

    try {
      setGstVerificationStatus({
        message: "Verifying GST number...",
        type: "pending",
      });

      // Note: GST verification API is external, so keeping fetch for this specific case
      const response = await fetch(
        `https://appyflow.in/api/verifyGST/?gstNo=${gstNumber}&key_secret=${gstApiSecret}`,
      );
      const data = await response.json();
      console.log("GST Details:", data);

      if (data.taxpayerInfo) {
        const taxpayerInfo = data.taxpayerInfo;
        const address = taxpayerInfo.pradr?.addr || {};
        console.log(taxpayerInfo.dty);
        console.log(address);

        setFormData((prev) => ({
          ...prev,
          gstVerified: true,
          gstType: taxpayerInfo.dty ? taxpayerInfo.dty.toLowerCase() : prev.gstType,
          companyName: taxpayerInfo.tradeNam || prev.companyName,
          addressLine1:
            address.bno + " " + address.flno + " " + address.loc || prev.addressLine1,
          addressLine2:
            [address.st, address.dst].filter(Boolean).join(", ") || prev.addressLine2,
          pincode: address.pncd || prev.pincode,
          city: address.city || taxpayerInfo.ctj || prev.city,
          state: address.stcd || prev.state,
        }));

        setGstVerificationStatus({
          message: "GST details successfully verified and applied",
          type: "success",
        });
      } else {
        setGstVerificationStatus({
          message: data.message || "Invalid GST number or verification failed",
          type: "error",
        });
        console.error("Error fetching GST details:", data.message || "Invalid response");
      }
    } catch (error) {
      setGstVerificationStatus({
        message: "Failed to verify GST. Please try again later.",
        type: "error",
      });
      console.error("Error fetching GST details:", error);
    }
  };

  const gstTypes: string[] = [
    "regular",
    "composition",
    "unregistered",
    "consumer",
    "unknown",
  ];

  // Fetch tags using API service
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const responseData = await get("/tag");
        console.log("Tags data:", responseData);
        const tags = responseData.data;
        console.log("Tags:", tags);
        setDefaultSelectTags(tags);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    fetchTags();
  }, [showCompanyTagsModal]);

  // Helper function to render error message
  const renderErrorMessage = (errorMsg: string) => {
    return errorMsg ? (
      <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
    ) : null;
  };


  return (
    <div className="min-h-screen relative flex justify-center w-full bg-neutral-50 pl-5 pt-7">
      <div className="w-full max-w-[576px] pb-[3.75rem]">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full px-5"
        >
          <TabsList className="grid grid-cols-3 gap-2 text-xs sm:text-sm rounded-full">
            <TabsTrigger
              value="personDetails"
              className="rounded-full font-normal px-3"
            >
              Contact <span className="hidden md:flex">Person Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="companyDetails"
              className="rounded-full font-normal px-3"
            >
              Company <span className="hidden md:flex">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="otherDetails"
              className="rounded-full font-normal px-3"
            >
              Other <span className="hidden md:flex">Details</span>
            </TabsTrigger>
          </TabsList>
          <div style={{ minHeight: "48px" }}>
            {error && typeof error === "string" && (
              <div className="bg-red-100 z-10 mt-2 text-red-700 p-2 rounded-md">
                {error}
              </div>
            )}
          </div>

          <TabsContent value="personDetails" className="mt-6">
            <form>
              <h3 className="font-medium text-2xl">
                Add Contact Person Details
              </h3>
              <div className="pt-5 space-y-1">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className={labelClasses}>
                      Full Name<span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      type="text"
                      required
                      className={`${inputClasses} ${
                        errors.name ? "border-red-500" : "border-neutral-200"
                      }`}
                      placeholder="Name"
                    />
                    {renderErrorMessage(errors.name)}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses}>
                      Work Email<span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      required
                      className={`${inputClasses} ${
                        errors.email ? "border-red-500" : "border-neutral-200"
                      }`}
                      placeholder="Email"
                    />
                    {renderErrorMessage(errors.email)}
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label className={labelClasses} htmlFor="mobileNumber">
                    Mobile Number<span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      name="phoneNo"
                      value={formData.phoneNo}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setFormData((prev) => ({ ...prev, phoneNo: value }));

                        // Validate as the user types
                        if (value === "" || /^[6-9]\d{9}$/.test(value)) {
                          setErrors((prev) => ({ ...prev, phoneNo: "" }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            phoneNo:
                              "Invalid phone number. Must start with 6-9 and be 10 digits.",
                          }));
                        }
                      }}
                      type="tel"
                      maxLength={10}
                      className={`peer ps-16 [direction:inherit] ${
                        errors.phoneNo ? "border-red-500" : "border-neutral-200"
                      } ${inputClasses}`}
                      placeholder="Enter 10 digit mobile number"
                    />

                    <div className="text-muted-foreground/80 text-sm pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50 border-r pr-2">
                      +91 🇮🇳
                    </div>
                  </div>
                  {renderErrorMessage(errors.phoneNo)}
                </div>
                <div className="space-y-2 mt-4">
                  <Label className={labelClasses} htmlFor="clientType">
                    Client Type<span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <RadioGroup
                    name="clientType"
                    value={formData.clientType}
                    onValueChange={(value: string) => {
                      setFormData((prev) => ({ ...prev, clientType: value }));
                      // Clear validation error when user selects
                      if (errors.clientType) {
                        setErrors((prev) => ({
                          ...prev,
                          clientType: "",
                        }));
                      }
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    <div className="border-input has-data-[state=checked]:border-primary/50 relative flex flex-col gap-4 border px-3 py-2 rounded-full shadow-xs outline-none">
                      <div className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem id="buyer" value="Buyer" />
                        <Label
                          htmlFor="buyer"
                          className="text-xs cursor-pointer"
                        >
                          Buyer
                        </Label>
                      </div>
                    </div>
                    <div className="border-input has-data-[state=checked]:border-primary/50 relative flex flex-col gap-4 border px-3 py-2 rounded-full shadow-xs outline-none">
                      <div className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem id="supplier" value="Supplier" />
                        <Label
                          htmlFor="supplier"
                          className="text-xs cursor-pointer"
                        >
                          Supplier
                        </Label>
                      </div>
                    </div>
                    <div className="border-input has-data-[state=checked]:border-primary/50 relative flex flex-col gap-4 border px-3 py-2 rounded-full shadow-xs outline-none">
                      <div className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem id="both" value="Both" />
                        <Label
                          htmlFor="both"
                          className="text-xs cursor-pointer"
                        >
                          Both
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {renderErrorMessage(errors.clientType)}
                </div>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="companyDetails" className="mt-6">
            <form>
              <h3 className="font-medium text-2xl">Add Company Details</h3>
              <div className="pt-5 space-y-3">
                <div className="bg-neutral-100 border border-neutral-200/20 rounded-md p-3">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex  gap-5">
                        <div className="space-y-1 w-full">
                          <Label className={labelClasses}>GST Number</Label>
                          <div className="relative">
                            <Input
                              name="gstNumber"
                              value={formData.gstNumber}
                              onChange={handleChange}
                              type="text"
                              className={`${inputClasses} required bg-white border-neutral-200 pe-9`}
                              placeholder="GST number"
                            />
                            <div
                              className="text-muted-foreground/80 p-2 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Subscribe"
                            >
                              <Button
                                onClick={() => {
                                  handleGetDetails(
                                    formData.gstNumber,
                                    import.meta.env.VITE_GST_API_SECRET,
                                  );
                                }}
                                className="h-[1.78rem] text-xs"
                              >
                                Get Details
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1 w-full md:max-w-36">
                          <Label className={labelClasses}>GST Type</Label>
                          <Select
                            name="gstType"
                            value={formData.gstType}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                gstType: value,
                              }))
                            }
                          >
                            <SelectTrigger
                              className={`${inputClasses} w-full bg-white border-neutral-200`}
                            >
                              <SelectValue placeholder="GST Type" />
                              <SelectContent>
                                {gstTypes.map((type) => (
                                  <SelectItem
                                    value={type.toLowerCase()}
                                    key={type}
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectTrigger>
                          </Select>
                        </div>
                      </div>
                      <div>
                        {gstVerificationStatus.message && (
                          <div
                            className={`mt-2 px-2 py-1 text-sm rounded ${
                              gstVerificationStatus.type === "success"
                                ? "bg-green-50 text-green-700"
                                : gstVerificationStatus.type === "pending"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {gstVerificationStatus.type === "success" && (
                              <span className="flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                {gstVerificationStatus.message}
                              </span>
                            )}
                            {gstVerificationStatus.type === "error" && (
                              <span className="flex items-center gap-1">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                {gstVerificationStatus.message}
                              </span>
                            )}
                            {gstVerificationStatus.type === "pending" && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="animate-spin h-4 w-4"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                {gstVerificationStatus.message}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 flex items-center text-[#8A6100] text-sm gap-2 w-full mt-4 rounded-md p-2">
                    <img src="/icons/base_alert.svg" alt="" /> Confirm the GST
                    number to auto-fill all details.
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <Label className={labelClasses}>
                    Company Name<span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    type="text"
                    required
                    className={`${inputClasses} ${
                      errors.companyName
                        ? "border-red-500"
                        : "border-neutral-200"
                    }`}
                    placeholder="Company Name"
                  />
                  {renderErrorMessage(errors.companyName)}
                </div>
                <div className="space-y-1">
                  <Label className={labelClasses}>
                    Company Email<span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    type="email"
                    required
                    className={`${inputClasses} ${
                      errors.companyEmail
                        ? "border-red-500"
                        : "border-neutral-200"
                    }`}
                    placeholder="Enter company email"
                  />
                  {renderErrorMessage(errors.companyEmail)}
                </div>
                <div className="space-y-1">
                  <Label className={labelClasses}>
                    Address Line 1<span className="text-[#F53D6B] ml-1">*</span>
                  </Label>
                  <Input
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    type="text"
                    required
                    className={`${inputClasses} ${
                      errors.addressLine1
                        ? "border-red-500"
                        : "border-neutral-200"
                    }`}
                    placeholder=""
                  />
                  {renderErrorMessage(errors.addressLine1)}
                </div>
                <div className="space-y-1">
                  <Label className={labelClasses}>Address Line 2</Label>
                  <Input
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    type="text"
                    className={`${inputClasses} border-neutral-200`}
                    placeholder=""
                  />
                </div>
                <div className="space-y-1 flex flex-col w-full md:flex-row items-center gap-2">
                  <div className="w-full">
                    <Label className={labelClasses}>
                      Pincode<span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Input
                      name="pincode"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setFormData((prev) => ({ ...prev, pincode: value }));

                        // Validate pincode length
                        if (value === "" || value.length !== 6) {
                          setErrors((prev) => ({
                            ...prev,
                            pincode: "Pincode must be 6 digits",
                          }));
                        } else {
                          setErrors((prev) => ({
                            ...prev,
                            pincode: "",
                          }));
                        }
                      }}
                      type="text"
                      required
                      maxLength={6}
                      className={`${inputClasses} ${
                        errors.pincode ? "border-red-500" : "border-neutral-200"
                      }`}
                      placeholder="Enter 6 digit pincode"
                    />
                    {renderErrorMessage(errors.pincode)}
                  </div>
                  <div className="w-full">
                    <Label className={labelClasses}>
                      City<span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      type="text"
                      required
                      className={`${inputClasses} ${
                        errors.city ? "border-red-500" : "border-neutral-200"
                      }`}
                      placeholder=""
                    />
                    {renderErrorMessage(errors.city)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="state">
                      State <span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Select
                      name="state"
                      value={formData.state ? formData.state.toString() : ""}
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          state: value, // assign state name instead of id
                        }));
                        // Clear validation error
                        setErrors((prev) => ({
                          ...prev,
                          state: "",
                        }));
                      }}
                    >
                      <SelectTrigger
                        className={`${inputClasses} w-full ${
                          errors.state ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {states.map((state) => (
                            <SelectItem value={state.name} key={state.id}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {renderErrorMessage(errors.state)}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClasses} htmlFor="country">
                      Country <span className="text-[#F53D6B] ml-1">*</span>
                    </Label>
                    <Select
                      name="country"
                      value={
                        formData.country ? formData.country.toString() : ""
                      }
                      onValueChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          country: value, // assign country name instead of id
                        }));
                        // Clear validation error
                        setErrors((prev) => ({
                          ...prev,
                          country: "",
                        }));
                      }}
                    >
                      <SelectTrigger
                        className={`${inputClasses} w-full ${
                          errors.country ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {countries.map((country) => (
                            <SelectItem value={country.name} key={country.id}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {renderErrorMessage(errors.country)}
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="otherDetails" className="mt-6">
            <form>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-2xl">Add Other Details</h3>
                <div
                  onClick={toggleCustomFieldsTableModal}
                  className="text-xs cursor-pointer underline underline-offset-2 text-[#7047EB]"
                >
                  + Add Custom Fields
                </div>
              </div>
              <div className="pt-5 space-y-1">
                <div className="space-y-2 mt-4">
                  <Label
                    className={labelClasses}
                    htmlFor="CompanyReferenceCode"
                  >
                    Company Reference Code
                  </Label>
                  <div className="relative">
                    <Input
                      name="companyReferenceCode"
                      value={formData.companyReferenceCode}
                      onChange={handleChange}
                      type="text"
                      className={`border ${inputClasses} border-neutral-200`}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-3 justify-between">
                    <Label className={labelClasses} htmlFor="tags">
                      Select tags
                    </Label>
                    <div
                      onClick={toggleCompanyTagsModal}
                      className="text-xs cursor-pointer underline underline-offset-2 text-[#7047EB]"
                    >
                      + Add Custom Tags
                    </div>
                  </div>
                  <Select
                    onValueChange={(value: string) =>
                      handleSelectDefaultTag(value)
                    }
                  >
                    <SelectTrigger
                      className={`${inputClasses} w-full border-neutral-200`}
                    >
                      <SelectValue placeholder="Select tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectContent>
                        {defaultSelectTags.map((tag) => (
                          <SelectItem value={tag.id.toString()} key={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectContent>
                  </Select>
                  {formData.tagIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tagIds.map((id) => {
                        const tag = defaultSelectTags.find((t) => t.id == id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-1 bg-blue-100 rounded-full px-2 py-1 text-sm"
                          >
                            <span>{tag?.name}</span>
                            <button
                              onClick={() => handleRemoveDefaultTag(id)}
                              className="font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className=" w-full">
                    <h3 className="font-medium my-8 text-xl text-gray-700">
                      Custom Fields
                    </h3>
                    <DynamicFieldsRenderer dynamicFields={dynamicFields} />
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
      <div className="h-[3.75rem] px-5 fixed bottom-0 border-t z-[5] bg-white flex items-center justify-center w-full">
        <div className="w-full flex items-center justify-between max-w-[576px]">
          <div>
            <Button
              variant="outline"
              className=""
              onClick={() => {
                if (activeTab === "personDetails") {
                  navigate("/buyers-suppliers?tab=all");
                } else if (activeTab === "companyDetails") {
                  setActiveTab("personDetails");
                } else if (activeTab === "otherDetails") {
                  setActiveTab("companyDetails");
                }
              }}
            >
              Back
            </Button>
          </div>
          <div className="flex items-center gap-5">
            <Button
              className="bg-[#7047EB] hover:bg-[#7047EB]"
              onClick={handleSaveAndNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Next"
              )}
            </Button>
          </div>
        </div>
      </div>
      <CustomFieldsModal
        isOpen={showCustomFieldsModal}
        onClose={toggleCustomFieldsModal}
        onSave={handleCustomFieldSave}
      />

      <CustomFieldsTableModals
        isOpen={showCustomFieldsTableModal}
        onClose={toggleCustomFieldsTableModal}
        toggleCustomFieldsModal={toggleCustomFieldsModal}
        onSaveFields={handleSaveFields}
        dynamicFields={dynamicFields}
        setDynamicFields={setDynamicFields}
      />
      <AddCompanyTagsModal
        isOpen={showCompanyTagsModal}
        onClose={toggleCompanyTagsModal}
        existingTags={defaultSelectTags.map((tag) => tag.name)}
      />
    </div>
  );
};

export default AddCompany;

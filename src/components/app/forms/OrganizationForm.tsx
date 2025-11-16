import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { get ,post} from "@/lib/apiService";
type SectorType = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type IndustryType = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const OrganizationForm: React.FC = () => {
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const inputClasses = "shadow-none border-neutral-200/70 focus-visible:ring-0";
  const labelClasses = "text-xs text-neutral-800";
  const navigate = useNavigate();
  const [industry, setIndustry] = useState<IndustryType[]>([]);
  const [sector, setSector] = useState<SectorType[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handleSubmit called");

    const formData = new FormData(event.currentTarget);
    const orgData = Object.fromEntries(formData.entries());

    const savedRegistrationData = localStorage.getItem("registrationData");
    const registrationData = savedRegistrationData
      ? JSON.parse(savedRegistrationData)
      : {};

    const finalPayload = {
      ...registrationData,
      ...orgData,
      companyType: "Pvt",
    };

    const formattedPayload = {
      name: finalPayload.name,
      email: finalPayload.email,
      companyType: finalPayload.companyType,
      companyName: finalPayload.companyName,
      password: finalPayload.password,
      phone: finalPayload.mobileNumber,
      sectorsId: Number(finalPayload.sector),
      industryId: Number(finalPayload.industry),
    };

    console.log(import.meta.env.VITE_BASE_URL);
    console.log(formattedPayload);
    try {
      

      const result = await post("/register",formattedPayload, false);
      console.log(" Response from server:", result);

      if (result.status) {
        setIsSuccess(true);
        setServerMessage(result.message || "Registration successful!");
        localStorage.removeItem("registrationData");
        localStorage.setItem("token", result.data.token);
        navigate("/");
      } else {
        setIsSuccess(false);
        setServerMessage(result.message || "Something went wrong.");
      }
    } catch (error) {
      console.error(" Error posting organization data:", error);
      setIsSuccess(false);
      setServerMessage("Network error. Please try again.");
    }
  };

 

  useEffect(() => {
    const fetchSectorsAndIndustries = async () => {
      try {
               const sectorData = await get("/sector");
        const industryData = await get("/industry");

        if (sectorData.status) setSector(sectorData.data);
        else console.error("Error fetching sectors:", sectorData.message);

        if (industryData.status) setIndustry(industryData.data);
        else console.error("Error fetching industries:", industryData.message);
      } catch (error) {
        console.error("Network error:", error);
      }
    };

    fetchSectorsAndIndustries();
  }, []);

  return (
    <div className="bg-white rounded-lg flex justify-center px-6 py-12 w-full max-w-md">
      <form className="space-y-2 w-full max-w-lg" onSubmit={handleSubmit}>
        <div className="bg-[#F53D6B] h-8 w-8 rounded" />
        <p className="text-neutral-600 text-xs">Welcome to ERP Solutions</p>
        <h3 className="text-lg leading-normal md:text-xl lg:text-2xl font-bold">
          Add Your Company
        </h3>
        <p className="max-w-xs text-sm">
          This is where your team can work and collaborate.
        </p>

        {serverMessage && (
          <div
            className={`text-sm mb-2 ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {serverMessage}
          </div>
        )}

        <div className="space-y-1">
          <div className="flex text-xs gap-4 items-center text-neutral-600">
            <div>Company Details</div>
          </div>
          <div className="space-y-2 mt-4">
            <Label className={labelClasses} htmlFor="companyName">
              Company Name <span className="text-[#F53D6B] -mr-2">*</span>
            </Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              className={inputClasses}
              placeholder="Enter Company name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="sector">
                Sector <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Select name="sector">
                <SelectTrigger className={`${inputClasses} w-full`}>
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectGroup>
                      {sector.map((s) => (
                        <SelectItem value={String(s.id)} key={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="industry">
                Industry <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Select name="industry">
                <SelectTrigger className={`${inputClasses} w-full`}>
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectGroup>
                      <SelectGroup>
                        {industry.map((i) => (
                          <SelectItem value={String(i.id)} key={i.id}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectGroup>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex text-xs gap-4 mt-3 items-center text-neutral-600">
            <div className="w-24">Personal Details</div>
          </div>
          {/* Personal Details add grid here */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2 mt-4">
              <Label className={labelClasses} htmlFor="fullName">
                Full Name
              </Label>
              <Input
                name="name"
                type="text"
                className={inputClasses}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label className={labelClasses} htmlFor="mobileNumber">
                Mobile Number
              </Label>
              <div className="relative">
                <Input
                  name="mobileNumber"
                  type="tel"
                  className={`peer ps-16 [direction:inherit] ${inputClasses}`}
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit mobile number"
                  required
                />
                <div className="text-muted-foreground/80 text-sm pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50 border-r pr-2">
                  +91 🇮🇳
                </div>
              </div>
            </div>
          </div>
          <div className="flex my-2 items-center gap-2 text-xs py-2">
            <Input
              type="checkbox"
              checked={isConsentChecked}
              onChange={(e) => setIsConsentChecked(e.target.checked)}
              className="w-3 h-3"
              required
            />
            I agree to receive all account related updates on WhatsApp & calls.
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!isConsentChecked}
              className="bg-[#7047EB] font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;

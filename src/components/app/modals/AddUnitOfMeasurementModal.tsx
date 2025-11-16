import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import React, { useRef, useState } from "react";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import {post} from "../../../lib/apiService"
const AddUnitOfMeasurementModal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Controlled input state
  const [unitName, setUnitName] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [unitDescription, setUnitDescription] = useState("");

  // Error state
  const [errors, setErrors] = useState({
    unitName: "",
    ewayBill: "",
  });

  const validateFields = () => {
    const newErrors = {
      unitName: "",
      ewayBill: "",
    };

    if (!unitName.trim()) {
      newErrors.unitName = "Unit Name is required";
    }

    if (!ewayBill.trim()) {
      newErrors.ewayBill = "E-way bill UoM is required";
    }

    setErrors(newErrors);
    return !newErrors.unitName && !newErrors.ewayBill;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    const payload = {
      name: unitName,
      uom: ewayBill,
      description: unitDescription,
    };

    try {
      const result = await post("/inventory/unit",payload);
      if (result.status) {
        console.log("Unit created:", result);
        SuccessToast({
          title: "Success",
          description: "Unit created successfully",
        });
        // Reset form
        setUnitName("");
        setEwayBill("");
        setUnitDescription("");
        setErrors({ unitName: "", ewayBill: "" });
        onClose();
      } else {
        ErrorToast({
          title: "Error",
          description: result?.message?.message || "Failed to create unit",
        });
        console.error("Error creating unit:", result);
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Failed to create unit",
      });
      console.error("Request error:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    switch (field) {
      case "unitName":
        setUnitName(value);
        break;
      case "ewayBill":
        setEwayBill(value);
        break;
      case "unitDescription":
        setUnitDescription(value);
        break;
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
            <h3 className="text-sm sm:text-lg font-semibold">
              Add Unit of Measurement
            </h3>
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
            <div className="grid md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="unitName">
                  Unit Name<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input
                  id="unitName"
                  name="name"
                  className={`${inputClasses} w-full ${errors.unitName ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="eg: Kg"
                  value={unitName}
                  onChange={(e) =>
                    handleInputChange("unitName", e.target.value)
                  }
                />
                {errors.unitName && (
                  <p className="text-red-500 text-xs mt-1">{errors.unitName}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="ewayBill">
                  E-way bill UoM<span className="text-[#F53D6B] ml-1">*</span>
                </Label>
                <Input
                  id="ewayBill"
                  name="uom"
                  className={`${inputClasses} w-full ${errors.ewayBill ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="eg: Box"
                  value={ewayBill}
                  onChange={(e) =>
                    handleInputChange("ewayBill", e.target.value)
                  }
                />
                {errors.ewayBill && (
                  <p className="text-red-500 text-xs mt-1">{errors.ewayBill}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="unitDescription">
                Unit Description
              </Label>
              <Input
                id="unitDescription"
                name="description"
                className={`${inputClasses} w-full`}
                placeholder="eg: Weight unit of measurement"
                value={unitDescription}
                onChange={(e) =>
                  handleInputChange("unitDescription", e.target.value)
                }
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUnitOfMeasurementModal;

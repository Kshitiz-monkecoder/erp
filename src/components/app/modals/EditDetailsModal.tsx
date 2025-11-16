import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import SuccessToast from "@/components/app/toasts/SuccessToast";
import { Input } from "@/components/ui/input";
import { put, get } from "@/lib/apiService";
// import ErrorToast from "@/components/app/toasts/ErrorToast";

interface EditDetailsModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  setCompanyData: (data: any) => void;
}

const EditDetailsModal: React.FC<EditDetailsModalProps> = ({
  id,
  isOpen,
  onClose,
  onSuccess,
  setCompanyData,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState(() => {
    const currentData = JSON.parse(localStorage.getItem("currentB&S") || "{}");
    return {
      companyName: currentData.companyName || "",
      phoneNo: currentData.phoneNo || "",
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Form data:", formData);
    e.preventDefault();
    try {
      await put(`/client/${id}`, formData);

      const updatedResponse = await get(`/client/${id}`);
      
      localStorage.setItem("currentB&S", JSON.stringify(updatedResponse.data));
      
      SuccessToast({
        title: "Details Edited.",
        description: "",
      });
      
      setCompanyData(updatedResponse.data);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating details:", error);
      // You can uncomment and use ErrorToast here if needed
      // ErrorToast({
      //   title: "Error",
      //   description: "Failed to update details. Please try again.",
      // });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
          <h4 className="font-semibold md:text-lg lg:text-xl">
            Edit Company Details
          </h4>
          <X className="text-[#8A8AA3] cursor-pointer w-5" onClick={onClose} />
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="companyName">
                Company Name <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`${inputClasses} w-full`}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="phoneNo">
                Company Phone Number{" "}
                <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                type="tel"
                id="phoneNo"
                name="phoneNo"
                value={formData.phoneNo}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^[6-9][0-9]*$/.test(value)) {
                    handleChange(e);
                  }
                }}
                pattern="^[6-9][0-9]{9}$"
                className={`${inputClasses} w-full ${
                  formData.phoneNo && !/^[6-9][0-9]{9}$/.test(formData.phoneNo)
                    ? "border-red-500"
                    : ""
                }`}
                placeholder="Enter company phone number"
                required
              />
              {formData.phoneNo && !/^[0-9]{10}$/.test(formData.phoneNo) && (
                <p className="text-red-500 text-sm mt-1">
                  Phone number must be exactly 10 digits
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#7047EB] hover:bg-[#5938c4] text-white rounded-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDetailsModal;
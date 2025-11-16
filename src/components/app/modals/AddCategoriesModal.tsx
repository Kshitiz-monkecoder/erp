import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import SuccessToast from "../toasts/SuccessToast";
import ErrorToast from "../toasts/ErrorToast";
import { post } from "@/lib/apiService";
interface AddCategoriesModalProps extends IModalProps {
  onSuccess?: () => void; // Callback to refresh table
}

const AddCategoriesModal: React.FC<AddCategoriesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Controlled input state
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Error state
  const [errors, setErrors] = useState({
    categoryName: "",
  });

  const validateFields = () => {
    const newErrors = {
      categoryName: "",
    };

    if (!categoryName.trim()) {
      newErrors.categoryName = "Category Name is required";
    }

    setErrors(newErrors);
    return !newErrors.categoryName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    const payload = {
      name: categoryName,
      description: categoryDescription,
    };

    try {
      setIsLoading(true);
      

      const result = await post("/inventory/categories", payload);

      if (result.status) {
        console.log("Category created:", result);
        SuccessToast({
          title: "Success",
          description: "Category created successfully",
        });
        // Reset form
        setCategoryName("");
        setCategoryDescription("");
        setErrors({ categoryName: "" });
        onSuccess?.(); // Trigger table refresh
        onClose();
      } else {
        ErrorToast({
          title: "Error",
          description: result?.message?.message || "Failed to create category",
        });
        console.error("Error creating category:", result);
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Failed to create category",
      });
      console.error("Request error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    switch (field) {
      case "categoryName":
        setCategoryName(value);
        break;
      case "categoryDescription":
        setCategoryDescription(value);
        break;
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Reset form when closing
      setCategoryName("");
      setCategoryDescription("");
      setErrors({ categoryName: "" });
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
            <h3 className="text-sm sm:text-lg font-semibold">Add Categories</h3>
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
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="categoryName">
                Name<span className="text-[#F53D6B] ml-1">*</span>
              </Label>
              <Input
                id="categoryName"
                name="name"
                className={`${inputClasses} w-full ${errors.categoryName ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="eg: Electronics"
                value={categoryName}
                onChange={(e) =>
                  handleInputChange("categoryName", e.target.value)
                }
                disabled={isLoading}
              />
              {errors.categoryName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.categoryName}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className={labelClasses} htmlFor="categoryDescription">
                Description
              </Label>
              <Input
                id="categoryDescription"
                name="description"
                className={`${inputClasses} w-full`}
                placeholder="Optional"
                value={categoryDescription}
                onChange={(e) =>
                  handleInputChange("categoryDescription", e.target.value)
                }
                disabled={isLoading}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoriesModal;

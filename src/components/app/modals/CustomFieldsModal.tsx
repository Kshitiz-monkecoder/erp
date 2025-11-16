import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import SuccessToast from "../toasts/SuccessToast";
import { IModalProps } from "@/lib/types";

interface IItem {
  fieldName: string;
  description: string;
  dataType: string;
  defaultValue: string;
  customFieldId: string;
  createdBy: string;
  creationDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  addedAs: string;
}

interface CustomFieldsModalProps extends IModalProps {
  onSave: (item: IItem) => void;
}

const CustomFieldsModal: React.FC<CustomFieldsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dataType, setDataType] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [defaultValue, setDefaultValue] = useState<string>("");

  const dataTypeOptions = [
    "Numeric",
    "Text",
    "Date and Time",
    "Date",
    "Select",
    "URL",
    "MultiSelect",
    "Currency",
  ];

  // Set default for date and datetime-local
  useEffect(() => {
    if (dataType === "Date") {
      // only date portion
      setDefaultValue(new Date().toISOString().split("T")[0]);
    } else if (dataType === "Date and Time") {
      // full datetime-local string without seconds
      const now = new Date().toISOString();
      setDefaultValue(now.slice(0, 16)); // YYYY-MM-DDTHH:mm
    } else {
      setDefaultValue("");
    }
  }, [dataType]);

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const parts = event.target.value.split(",");
    setSelectedList(parts.map((p) => p.trim()).filter(Boolean));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    let desc = (formData.get("description") as string) || "";
    if (dataType === "Select" || dataType === "MultiSelect") {
      desc = selectedList.join(",");
    }

    const rawDefault = formData.get("defaultValue") as string;
    const finalDefault = rawDefault !== "" ? rawDefault : defaultValue;

    const newField: IItem = {
      fieldName: formData.get("name") as string,
      description: desc,
      dataType: dataType || "Text",
      defaultValue: finalDefault,
      customFieldId: Math.random().toString(36).substring(2, 10),
      createdBy: "User",
      creationDate: new Date().toISOString(),
      lastModifiedBy: "User",
      lastModifiedDate: new Date().toISOString(),
      addedAs: formData.get("role") as string,
    };

    onSave(newField);
    onClose();
    SuccessToast({
      title: "Custom Field Added",
      description: `${newField.fieldName} has been added successfully.`,
    });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex px-6 py-4 items-center bg-gray-100 rounded-t-lg justify-between">
            <h3 className="font-semibold">Add Custom Field</h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <div className="border-b border-neutral-200" />

          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="role">Add as</Label>
              <Select name="role" required>
                <SelectTrigger>
                  <SelectValue placeholder="Buyer / Supplier / Other" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buyer">Buyer</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input name="name" type="text" required />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="dataType">Data Type</Label>
                <Select
                  name="dataType"
                  onValueChange={(v) => setDataType(v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {dataType === "Select" || dataType === "MultiSelect" ? (
              <>
                <div className="space-y-1">
                  <Label htmlFor="description">List Options</Label>
                  <Textarea
                    name="description"
                    rows={2}
                    placeholder="Enter options, comma-separated"
                    onChange={handleTextareaChange}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <Select name="defaultValue">
                    <SelectTrigger>
                      <SelectValue placeholder="Choose default" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedList.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" rows={2} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="defaultValue">Default Value</Label>
                  <Input
                    name="defaultValue"
                    type={
                      dataType === "Numeric"
                        ? "number"
                        : dataType === "Date"
                          ? "date"
                          : dataType === "Date and Time"
                            ? "datetime-local"
                            : "text"
                    }
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end px-6 py-4 border-t">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomFieldsModal;

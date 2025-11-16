import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export interface IItem {
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

interface DynamicFieldsRendererProps {
  dynamicFields: IItem[];
  onChange?: (id: string, value: string | string[]) => void;
}

const DynamicFieldsRenderer: React.FC<DynamicFieldsRendererProps> = ({
  dynamicFields,
  onChange,
}) => {
  // Track multi-select values per field
  const [multiValues, setMultiValues] = useState<Record<string, string[]>>({});

  const handleMultiChange = (fieldId: string, vals: string[]) => {
    setMultiValues((prev) => ({ ...prev, [fieldId]: vals }));
    onChange && onChange(fieldId, vals);
  };

  const removeMultiValue = (fieldId: string, val: string) => {
    const updated = (multiValues[fieldId] || []).filter((v) => v !== val);
    setMultiValues((prev) => ({ ...prev, [fieldId]: updated }));
    onChange && onChange(fieldId, updated);
  };

  const buildDynamic = (field: IItem) => {
    const commonInputProps = {
      id: field.customFieldId,
      name: field.customFieldId,
      className: "w-full",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange && onChange(field.customFieldId, e.target.value),
    };
    const options = field.description
      .split(",")
      .map((opt) => opt.trim())
      .filter(Boolean);

    switch (field.dataType) {
      case "Numeric":
        return (
          <Input
            type="number"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      case "Date":
        return (
          <Input
            type="date"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      case "Date and Time":
        return (
          <Input
            type="datetime-local"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      case "Text":
        return (
          <Input
            type="text"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      case "Select":
        return (
          <Select
            defaultValue={field.defaultValue || undefined}
            onValueChange={(val) =>
              onChange && onChange(field.customFieldId, val)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${field.fieldName}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "MultiSelect": {
        const selected = multiValues[field.customFieldId] || [];
        return (
          <>
            <div className="relative">
              <button
                type="button"
                className="w-full border border-gray-300 rounded px-3 py-2 text-left"
                onClick={() => {
                  const dropdown = document.getElementById(
                    `dropdown-${field.customFieldId}`,
                  );
                  if (dropdown) dropdown.classList.toggle("hidden");
                }}
              >
                {selected.length > 0
                  ? selected.join(", ")
                  : `Select ${field.fieldName}`}
              </button>
              <div
                id={`dropdown-${field.customFieldId}`}
                className="absolute z-10 bg-white border border-gray-300 rounded shadow-md mt-1 hidden"
              >
                {options.map((opt) => (
                  <div key={opt} className="px-3 py-2 hover:bg-gray-100">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => {
                          const newSelected = selected.includes(opt)
                            ? selected.filter((v) => v !== opt)
                            : [...selected, opt];
                          handleMultiChange(field.customFieldId, newSelected);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {/* display selected with remove option */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selected.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeMultiValue(field.customFieldId, val)}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </>
        );
      }
      case "URL":
        return (
          <Input
            type="url"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      case "Currency":
        return (
          <Input
            type="text"
            placeholder="0.00"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
      default:
        return (
          <Input
            type="text"
            defaultValue={field.defaultValue}
            {...commonInputProps}
          />
        );
    }
  };

  return (
    <div className="grid gap-6">
      {dynamicFields.map((field) => (
        <div key={field.customFieldId} className="space-y-1">
          <Label
            htmlFor={field.customFieldId}
            className="text-sm font-medium text-gray-700"
          >
            {field.fieldName}
          </Label>
          {field.dataType !== "Select" && field.dataType !== "MultiSelect" && (
            <p className="text-xs text-gray-500">{field.description}</p>
          )}
          {buildDynamic(field)}
        </div>
      ))}
    </div>
  );
};

export default DynamicFieldsRenderer;

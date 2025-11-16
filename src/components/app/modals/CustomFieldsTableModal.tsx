import React, { useRef, useState } from "react";
import { PlusIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomFieldsTable from "../tables/CustomFieldsTable";
import CustomFieldsModal from "../modals/CustomFieldsModal";
import { IModalProps } from "@/lib/types";

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

interface ICustomFieldsTableModal extends IModalProps {
  toggleCustomFieldsModal: () => void;
  onSaveFields: (items: IItem[]) => void;
  dynamicFields: IItem[];
  setDynamicFields: (fields: IItem[]) => void;
}

const CustomFieldsTableModals: React.FC<ICustomFieldsTableModal> = ({
  isOpen,
  onClose,
  onSaveFields,
  toggleCustomFieldsModal: _toggleCustomFieldsModal,
  dynamicFields,
  setDynamicFields,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleSaveField = (newField: IItem) => {
    console.log("save field triggered");
    setDynamicFields([...dynamicFields, newField]);
    setShowAddModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-10 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-2xl animate-in fade-in duration-200 flex flex-col"
        ref={modalRef}
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Custom Fields</h3>
          <X className="h-5 cursor-pointer" onClick={onClose} />
        </div>
        <div className="border-b border-neutral-300" />

        <div className="p-4 flex-1 overflow-auto">
          <CustomFieldsTable items={dynamicFields} />
          <div
            onClick={() => setShowAddModal(true)}
            className="mt-4 text-xs flex items-center gap-2 cursor-pointer text-[#7047EB]"
          >
            <PlusIcon className="w-3" /> Add New Field
          </div>
        </div>

        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onClose();
              onSaveFields(dynamicFields);
            }}
          >
            Save Fields
          </Button>
        </div>
      </div>

      <CustomFieldsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveField}
      />
    </div>
  );
};

export default CustomFieldsTableModals;

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
import { IModalProps } from "@/lib/types";
import React, { useRef, useState } from "react";
import { post } from "@/lib/apiService";
interface IAddCompanyTagsModal extends IModalProps {
  existingTags: string[];
}

const AddCompanyTagsModal: React.FC<IAddCompanyTagsModal> = ({
  isOpen,
  onClose,
  existingTags,
}) => {
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [textareaValue, setTextareaValue] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newUniqueTags = selectedList.filter(
      (tag) => !existingTags.includes(tag)
    );
    console.log(newUniqueTags);
    await Promise.all(
      newUniqueTags.map(async (tag) => {
        try {
          await post(`/tag`, {
            name: tag,
            description: ''
          });
        } catch (error) {
          console.error(`Error creating tag: ${tag}`, error);
        }
      })
    );

    onClose();
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setTextareaValue(value);
    // Split the value by commas, trim whitespace, remove empty strings, and ensure uniqueness
    const parts = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    const uniqueTags = Array.from(new Set(parts));
    setSelectedList(uniqueTags);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 h-[100vh] m-0 bg-black/40 flex items-center justify-center z-50 p-10">
      <div
        className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex px-6 py-4 items-center bg-gray-100 rounded-t-lg justify-between">
            <h3 className="font-semibold">Add Company Tags</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="text-sm shadow-none font-normal"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#7047EB] flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
              >
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-1 px-6 py-4">
            <div className="flex items-center gap-1">
              <Label className={labelClasses}>Tags Options</Label>
              <span className="text-[#F53D6B] -mr-3 textxs">*</span>
            </div>
            <Textarea
              value={textareaValue}
              className={`${inputClasses} max-h-20`}
              onChange={handleTextareaChange}
              placeholder="Enter tags separated by commas"
            />
            {selectedList.length > 0 && (
              <div className="mt-4">
                <Label className={labelClasses}>Added Tags:</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedList.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyTagsModal;

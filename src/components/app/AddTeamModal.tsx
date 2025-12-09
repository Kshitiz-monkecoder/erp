import React, { useState } from "react";
import { X } from "lucide-react";
import { userService } from "../../services/userService";
import ErrorToast from "@/components/app/toasts/ErrorToast";

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamAdded: () => void;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamAdded,
}) => {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      ErrorToast({
        title: "Validation Error",
        description: "Team name is required",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.createTeam({
        name: teamName,
        description: description || undefined,
      });
      
      onTeamAdded();
      onClose();
      
      // Reset form
      setTeamName("");
      setDescription("");
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: "Failed to create team",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
      <div className="bg-white w-[550px] rounded-lg shadow-lg p-6 relative">
        {/* Close Button */}
        <button className="absolute top-3 right-3" onClick={onClose}>
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add Team</h2>

        {/* Team Name */}
        <label className="text-sm text-gray-700">Team Name *</label>
        <input
          className="border w-full h-10 px-3 rounded-md mb-3"
          placeholder="Enter team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />

        {/* Description */}
        <label className="text-sm text-gray-700">Description</label>
        <textarea
          className="border w-full px-3 py-2 rounded-md h-20"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Footer */}
        <div className="flex justify-end mt-5 gap-2">
          <button
            className="border border-gray-300 px-5 py-2 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || !teamName.trim()}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeamModal;
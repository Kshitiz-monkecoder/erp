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

  // Static permissions object
  const staticPermissions = {
    UserManagement: {
      basic: true,
      moderate: false,
      full: false,
      critical: false
    }
  };

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
      // Create team with static permissions
      const teamData = {
        name: teamName,
        description: description || undefined,
        permissions: staticPermissions
      };

      console.log("Creating team with payload:", teamData);
      
      await userService.createTeam(teamData);
      
      onTeamAdded();
      onClose();
      
      // Reset form
      setTeamName("");
      setDescription("");
    } catch (error) {
      console.error("Error creating team:", error);
      ErrorToast({
        title: "Error",
        description: "Failed to create team. Please try again.",
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
        <button 
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Add Team</h2>

        {/* Team Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            className="border w-full h-10 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="border w-full px-3 py-2 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Permissions Info */}
        {/* <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Default Permissions</h3>
          <p className="text-xs text-blue-600 mb-2">
            This team will be created with default UserManagement permissions:
          </p>
          <div className="text-xs bg-white p-3 rounded border">
            <code className="text-gray-700">
              UserManagement: {"{basic: true, moderate: false, full: false, critical: false}"}
            </code>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Permissions can be modified later from the team settings.
          </p>
        </div> */}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting || !teamName.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeamModal;
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { userService, TeamResponse } from "../../services/userService";
import ErrorToast from "@/components/app/toasts/ErrorToast";

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamAdded: () => void;
  team?: TeamResponse | null; // 👈 for edit
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamAdded,
  team,
}) => {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default permissions
  const staticPermissions = {
    UserManagement: {
      basic: true,
      moderate: false,
      full: false,
      critical: false,
    },
  };

  // Prefill data for EDIT
  useEffect(() => {
    if (team) {
      setTeamName(team.name);
      setDescription(team.description || "");
    } else {
      setTeamName("");
      setDescription("");
    }
  }, [team]);

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
      const payload = {
        name: teamName,
        description: description || undefined,
        permissions: staticPermissions,
      };

      if (team) {
        // UPDATE
        await userService.updateTeam(team.id, payload);
      } else {
        // CREATE
        await userService.createTeam(payload);
      }

      onTeamAdded();
      onClose();
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: team
          ? "Failed to update team"
          : "Failed to create team",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
      <div className="bg-white w-[550px] rounded-lg shadow-lg p-6 relative">
        {/* Close */}
        <button
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {team ? "Edit Team" : "Add Team"}
        </h2>

        {/* Team Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Team Name <span className="text-red-500">*</span>
          </label>
          <input
            className="border w-full h-10 px-3 rounded-md"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            className="border w-full h-20 px-3 py-2 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            className="px-4 py-2 bg-gray-100 rounded-md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : team
              ? "Update Team"
              : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTeamModal;

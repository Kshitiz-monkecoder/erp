import React, { useEffect, useState } from "react";
import { X,  Copy, Users } from "lucide-react";
import { userService } from "../../services/userService"; // Use userService
import ErrorToast from "@/components/app/toasts/ErrorToast";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [emails, setEmails] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) fetchTeams();
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const res = await userService.getAllTeams(); // Use userService
      if (res?.status) {
        setTeams(res.data);
        // Set invite link if available from API
        // setInviteLink(res.data.inviteURL || "");
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Unable to fetch teams",
      });
    }
  };

  const handleTeamSelect = (teamName: string, teamId: number) => {
    setSelectedTeam(teamName);
    setSelectedTeamId(teamId);
  };

  const handleGenerateInviteLink = async () => {
    if (!selectedTeamId) {
      ErrorToast({
        title: "Error",
        description: "Please select a team first",
      });
      return;
    }

    try {
      const res = await userService.generateInviteLink({
        teamId: selectedTeamId,
        emails: emails ? emails.split(",").map(email => email.trim()) : []
      });
      
      if (res?.status && res.data.link) {
        setInviteLink(res.data.link);
      }
    } catch (error) {
      ErrorToast({
        title: "Error",
        description: "Failed to generate invite link",
      });
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      // Optional: Show success toast
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
      <div className="bg-white w-[650px] rounded-lg shadow-lg p-6 relative">
        {/* Close Button */}
        <button className="absolute top-3 right-3" onClick={onClose}>
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">Add a Team Member</h2>

        {/* Select Team */}
        <label className="text-gray-600 text-sm mb-1 block">Select Team</label>
        <select
          value={selectedTeam}
          onChange={(e) => {
            const selectedOption = e.target.selectedOptions[0];
            const teamId = parseInt(selectedOption.getAttribute("data-id") || "0");
            handleTeamSelect(e.target.value, teamId);
          }}
          className="border w-full h-10 rounded-md px-3 mb-2 text-sm"
        >
          <option value="">Select Team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.name} data-id={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Permissions Note */}
        <p className="text-gray-500 text-sm mb-3">
          All permissions of {selectedTeam || "selected team"} will be granted.
          <br />Go to Team Page in settings to view/modify the permission.
        </p>

        {/* Email Invite */}
        <div className="mt-4 mb-1 text-gray-700 font-medium text-sm">
          EMAIL INVITE
        </div>
        <input
          placeholder="Enter email ids separated by a comma"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          className="border w-full h-10 rounded-md px-3 text-sm mb-3"
        />

        {/* Email Invite Button */}
        <button 
          className="border px-4 py-2 rounded-md text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm mb-6"
          onClick={handleGenerateInviteLink}
          disabled={!selectedTeamId}
        >
          Email Invite
        </button>

        {/* Shareable Link */}
        <div className="text-gray-700 font-medium text-sm mb-1">
          OR COPY SHAREABLE LINK
        </div>
        <div className="flex items-center border rounded-md px-3 h-10 bg-gray-50">
          <input
            className="flex-1 bg-transparent text-sm"
            value={inviteLink}
            readOnly
            placeholder="Invite link will appear here..."
          />
          <Copy 
            className="w-4 h-4 cursor-pointer text-gray-600 hover:text-gray-800" 
            onClick={handleCopyLink}
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between mt-6">
          <button className="border border-green-500 px-4 py-2 rounded-md flex items-center gap-2 text-green-600 text-sm hover:bg-green-50">
            <Users className="w-4 h-4" />
            View All Members
          </button>

          <button
            className="bg-green-600 text-white px-5 py-2 rounded-md text-sm hover:bg-green-700"
            onClick={() => {
              onUserAdded();
              onClose();
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
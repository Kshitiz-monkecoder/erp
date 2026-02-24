import React, { useEffect, useState } from "react";
import { X, Copy } from "lucide-react";
import { userService, TeamResponse } from "../../services/userService";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";

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
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [emails, setEmails] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [previousTeamId, setPreviousTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
      // Reset state when modal opens
      setSelectedTeam("");
      setSelectedTeamId(null);
      setEmails("");
      setInviteLink("");
      setPreviousTeamId(null);
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const res = await userService.getAllTeams();
      if (res?.status) {
        setTeams(res.data || []);
      }
    } catch (err) {
      ErrorToast({
        title: "Error",
        description: "Unable to fetch teams",
      });
    }
  };

  const handleTeamSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const teamId = parseInt(selectedOption.getAttribute("data-id") || "0");
    const teamName = e.target.value;
    
    // Set team information
    setSelectedTeam(teamName);
    setSelectedTeamId(teamId);
    
    // Reset invite link if team is deselected
    if (!teamId) {
      setInviteLink("");
      setPreviousTeamId(null);
      return;
    }
    
    // Only generate new link if team changed
    if (teamId !== previousTeamId) {
      setPreviousTeamId(teamId);
      await generateInviteLink(teamId);
    }
  };

  const generateInviteLink = async (teamId: number) => {
    setIsGenerating(true);
    setInviteLink(""); // Clear previous link while generating

    try {
      const res = await userService.generateInviteLink({
        teamId: teamId,
        emails: undefined // Just generate link, don't send email
      });
      
      if (res?.status && res.data.link) {
        setInviteLink(res.data.link);
        
        // Auto-copy link to clipboard when generated
        setTimeout(() => {
          handleCopyLink();
        }, 100);
      }
    } catch (error: any) {
      ErrorToast({
        title: "Error",
        description: error.message || "Failed to generate invite link",
      });
      setInviteLink("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailInvite = async () => {
    if (!selectedTeamId) {
      ErrorToast({
        title: "Error",
        description: "Please select a team first",
      });
      return;
    }

    const emailList = emails 
      ? emails.split(",").map(email => email.trim()).filter(email => email.length > 0)
      : [];

    if (emailList.length === 0) {
      ErrorToast({
        title: "Error",
        description: "Please enter at least one email address",
      });
      return;
    }

    setIsEmailSending(true);

    try {
      const res = await userService.generateInviteLink({
        teamId: selectedTeamId,
        emails: emailList
      });
      
      if (res?.status && res.data.link) {
        SuccessToast({
          title: "Success",
          description: `Invitation email${emailList.length > 1 ? 's' : ''} sent successfully`,
        });
        
        // Reset email field after sending
        setEmails("");
      }
    } catch (error: any) {
      ErrorToast({
        title: "Error",
        description: error.message || "Failed to send email invitations",
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      SuccessToast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[999]">
      <div className="bg-white w-[650px] rounded-lg shadow-lg p-6 relative">
        {/* Close Button */}
        <button 
          className="absolute top-3 right-3 hover:bg-gray-100 p-1 rounded"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-4">Add a Team Member</h2>

        {/* Select Team */}
        <div className="mb-4">
          <label className="text-gray-600 text-sm mb-1 block">Select Team *</label>
          <select
            value={selectedTeam}
            onChange={handleTeamSelect}
            className="border w-full h-10 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isGenerating}
          >
            <option value="">Select Team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name} data-id={t.id}>
                {t.name} ({t.userCount} user{t.userCount !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
          
          {selectedTeam && (
            <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
              <span>Selected: {selectedTeam}</span>
              {isGenerating && (
                <span className="flex items-center gap-1 text-blue-600">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Generating link...
                </span>
              )}
            </p>
          )}
        </div>

        {/* Email Invite Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-700 font-medium text-sm">
              EMAIL INVITE (Optional)
            </label>
            <span className="text-xs text-gray-500">
              {emails.split(',').filter(e => e.trim()).length} email(s)
            </span>
          </div>
          <textarea
            placeholder="Enter email addresses separated by commas"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="border w-full h-20 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={3}
            disabled={!selectedTeamId}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              Separate multiple emails with commas
            </span>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium ${!selectedTeamId || isEmailSending || !emails.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleEmailInvite}
              disabled={!selectedTeamId || isEmailSending || !emails.trim()}
            >
              {isEmailSending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                'Email Invite'
              )}
            </button>
          </div>
        </div>

        {/* Shareable Link Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-700 font-medium text-sm">
              SHAREABLE LINK {selectedTeamId && !isGenerating && "✓"}
            </label>
            {selectedTeamId && inviteLink && (
              <button
                className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                onClick={handleCopyLink}
              >
                <Copy className="w-3 h-3" />
                Copy Again
              </button>
            )}
          </div>
          
          <div className="flex items-center border rounded-md px-3 h-12 bg-gray-50">
            <input
              className="flex-1 bg-transparent text-sm focus:outline-none"
              value={inviteLink}
              readOnly
              placeholder={selectedTeamId 
                ? isGenerating 
                  ? "Generating invite link..." 
                  : "Invite link will appear here automatically"
                : "Select a team to generate invite link"
              }
            />
            {inviteLink && (
              <button 
                onClick={handleCopyLink}
                className="ml-2 p-2 hover:bg-gray-200 rounded transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-gray-600 hover:text-gray-800" />
              </button>
            )}
          </div>
          
          {inviteLink && (
            <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Link automatically generated and copied to clipboard!
            </div>
          )}
          
          {selectedTeamId && !inviteLink && !isGenerating && (
            <div className="mt-2 text-xs text-yellow-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Please wait while we generate your invite link...
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end pt-4 border-t">
          <div className="flex gap-2">
            <button
              className="border border-gray-300 px-4 py-2 rounded-md text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-green-600 text-white px-5 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
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
    </div>
  );
};

export default AddUserModal;
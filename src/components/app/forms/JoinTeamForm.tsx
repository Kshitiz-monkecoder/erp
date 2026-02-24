// src/components/app/forms/JoinTeamForm.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router";
import { userService } from "@/services/userService";
// import ErrorToast from "@/components/app/toasts/ErrorToast";
import SuccessToast from "@/components/app/toasts/SuccessToast";

const JoinTeamForm: React.FC = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teamInfo] = useState<{ name?: string; company?: string } | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  useEffect(() => {
    // If no token, redirect to login
    if (!token) {
      navigate("/login");
      return;
    }

    // Here you could validate the token or fetch team info
    // For now, we'll assume it's valid and show the form
    setTokenValid(true);
    
    // Optional: You could add an API call to validate the token
    // and fetch team/company information
    // validateToken(token);
  }, [token, navigate]);

  const toggleVisibility = () => setIsPasswordVisible((prev) => !prev);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const obj = {
      token: token,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
    };

    try {
      const result = await userService.joinTeam(obj);
      
      if (result.status) {
        SuccessToast({
          title: "Success",
          description: "You have successfully joined the team!",
        });
        
        // Store the token and redirect to dashboard
        localStorage.setItem("token", result.data.token);
        navigate("/");
      } else {
        setErrorMessage(result.message || "Failed to join team");
      }
    } catch (error: any) {
      console.error("Join team error:", error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        "An error occurred while joining the team"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="bg-white rounded-lg px-8 py-12 w-full max-w-md text-center">
        <div className="text-red-500 mb-4">Invalid or expired invite link</div>
        <Button onClick={() => navigate("/login")} className="bg-[#7047EB] hover:bg-[#7047EB]/90">
          Go to Login
        </Button>
      </div>
    );
  }

  const inputClasses = "shadow-none border-neutral-200/70 focus-visible:ring-0";
  const labelClasses = "text-xs text-neutral-800";

  return (
    <div className="bg-white rounded-lg px-6 py-8 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Join Team Invitation</h2>
        <p className="text-gray-600 text-sm mt-1">
          You've been invited to join a team. Complete your registration below.
        </p>
        {teamInfo && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Joining: <span className="font-semibold">{teamInfo.name}</span>
            </p>
            {teamInfo.company && (
              <p className="text-xs text-blue-700 mt-1">Company: {teamInfo.company}</p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      {/* Registration Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label className={labelClasses} htmlFor="name">
            Full Name *
          </Label>
          <Input
            name="name"
            type="text"
            required
            className={inputClasses}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label className={labelClasses} htmlFor="email">
            Email *
          </Label>
          <Input
            name="email"
            type="email"
            required
            className={inputClasses}
            placeholder="Enter your email"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label className={labelClasses} htmlFor="phone">
            Phone Number *
          </Label>
          <Input
            name="phone"
            type="tel"
            required
            className={inputClasses}
            placeholder="Enter your phone number"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label className={labelClasses} htmlFor="password">
            Create Password *
          </Label>
          <div className="relative">
            <Input
              name="password"
              className={`${inputClasses} pe-9`}
              placeholder="Create a password"
              required
              type={isPasswordVisible ? "text" : "password"}
              disabled={isLoading}
              minLength={6}
            />
            <button
              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-gray-400 hover:text-gray-600"
              type="button"
              onClick={toggleVisibility}
              disabled={isLoading}
            >
              {isPasswordVisible ? (
                <EyeOffIcon size={16} />
              ) : (
                <EyeIcon size={16} />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        <Button
          type="submit"
          className="bg-[#7047EB] font-normal w-full shadow-none hover:bg-[#7047EB] hover:opacity-95"
          disabled={isLoading}
        >
          {isLoading ? "Joining Team..." : "Join Team"}
        </Button>
      </form>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>By joining, you agree to the team's terms and conditions</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#7047EB] underline"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default JoinTeamForm;
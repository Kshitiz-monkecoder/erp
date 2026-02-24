import React from "react";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Access Restricted
          </h1>
          
          <p className="text-gray-600 mb-6">
            You don't have permission to access this module. Please contact your team administrator 
            if you believe this is a mistake.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-[#105076] hover:bg-[#0d4566]"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need access? Contact your team administrator or supervisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
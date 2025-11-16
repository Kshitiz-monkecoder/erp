import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router";
import { post } from "@/lib/apiService";

const LoginForm: React.FC = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const toggleVisibility = () =>
    setIsPasswordVisible((prevState) => !prevState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const obj = Object.fromEntries(formData);
    console.log(obj);

    try {
      // Fixed: Pass the data object directly and set requiresAuth to false for login
      const result = await post("/login", obj, false);
      console.log(result);
      console.log("Response from server:", result);

      if (result.status) {
        localStorage.setItem("token", result.data.token);
        navigate("/");
      } else {
        setErrorMessage(result.message);
        console.error("Error:", result.message);
      }
    } catch (error: any) {
      console.log(error)
      setErrorMessage(error.message || "An error occurred while logging in.");
      console.error("Error posting login data:", error);
    }
  };

  const inputClasses: string =
    "shadow-none border-neutral-200/70 focus-visible:ring-0";
  const labelClasses: string = "text-xs text-neutral-800";

  return (
    <div className="bg-white rounded-lg flex justify-center pt-20 md:pb-[14rem] px-6 py-12 w-full flex-col max-w-md">
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {errorMessage}
        </div>
      )}

      <form className="space-y-3 w-full max-w-md" onSubmit={handleSubmit}>
        <div className="bg-[#F53D6B] h-8 w-8 rounded" />
        <p className="text-neutral-600 text-xs">Welcome to ERP Solutions</p>
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold max-w-48">
          Get started with your email
        </h3>
        <div className="space-y-2 mt-4">
          <Label className={labelClasses} htmlFor="email">
            Email
          </Label>
          <Input
            name="email"
            type="email"
            required
            className={inputClasses}
            placeholder="Enter your email"
          />
        </div>
        <div className="space-y-2 mt-2">
          <Label className={labelClasses} htmlFor="password">
            Password
          </Label>
          <div className="relative">
            <Input
              name="password"
              className={`${inputClasses} pe-9`}
              placeholder="Password"
              required
              type={isPasswordVisible ? "text" : "password"}
            />
            <button
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={toggleVisibility}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              aria-pressed={isPasswordVisible}
              aria-controls="password"
            >
              {isPasswordVisible ? (
                <EyeOffIcon size={16} aria-hidden="true" />
              ) : (
                <EyeIcon size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="bg-[#7047EB] font-normal w-full shadow-none hover:bg-[#7047EB] hover:opacity-95"
        >
          Continue
        </Button>
        <div className="text-xs">
          New to ERP Solutions?{" "}
          <Link
            to="/register"
            className="text-[#7047EB] underline underline-offset-2"
          >
            <span>Create Account</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
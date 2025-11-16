import LoginForm from "@/components/app/forms/LoginForm";
import React from "react";

const LoginPage: React.FC = () => {
  return (
    <main
      className="min-h-screen relative bg-cover bg-center"
      style={{
        backgroundImage: "url(/login.png)",
        // backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full flex md:justify-end p-4 md:py-4 md:pr-4 justify-center items-center">
        <LoginForm />
      </div>
    </main>
  );
};

export default LoginPage;

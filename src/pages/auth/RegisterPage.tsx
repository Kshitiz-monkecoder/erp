import RegisterForm from "@/components/app/forms/RegisterForm";
import React from "react";

const RegisterPage: React.FC = () => {
  return (
    <main
      className="min-h-screen relative bg-cover bg-center"
      style={{
        backgroundImage: "url(/register.png)",
        // backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full flex md:justify-end p-4 md:py-4 md:pr-4 justify-center items-center">
        <RegisterForm />
      </div>
    </main>
  );
};

export default RegisterPage;

// src/pages/JoinTeamPage.tsx
import React from "react";
import JoinTeamForm from "@/components/app/forms/JoinTeamForm";

const JoinTeamPage: React.FC = () => {
  return (
    <main
      className="min-h-screen relative bg-cover bg-center"
      style={{
        backgroundImage: "url(/login.png)", // Or a different background
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full flex md:justify-end p-4 md:py-4 md:pr-4 justify-center items-center">
        <JoinTeamForm />
      </div>
    </main>
  );
};

export default JoinTeamPage;
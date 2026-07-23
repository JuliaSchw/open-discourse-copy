import { Header } from "./components/header";
import React from "react";

export const BaseTemplate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="px-6 py-6">{children}</div>
    </div>
  );
};

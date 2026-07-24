import { Header } from "./components/header";
import React from "react";

export const BaseTemplate: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div data-theme="odtheme" className="min-h-screen bg-base-200">
      <Header />
      <div className="px-3 py-4 md:px-4 md:py-6">{children}</div>
    </div>
  );
};

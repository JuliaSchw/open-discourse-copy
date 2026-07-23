import React from "react";

export const Header: React.FC = () => {
  return (
    <nav className="flex w-full items-center justify-between flex-wrap bg-pink-500 px-6 py-6 text-white">
      <h1 className="text-xl font-semibold tracking-tight">
        Open Discourse Volltextsuche
      </h1>
    </nav>
  );
};

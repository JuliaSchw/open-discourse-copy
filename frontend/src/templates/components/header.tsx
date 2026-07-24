import React from "react";

export const Header: React.FC = () => {
  return (
    <nav className="navbar border-b border-base-300 bg-base-100 px-4">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral">
          Open Discourse
        </h1>
        <div className="badge badge-primary badge-outline hidden md:inline-flex">
          Volltextsuche
        </div>
      </div>
    </nav>
  );
};

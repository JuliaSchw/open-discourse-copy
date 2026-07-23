import React from "react";

interface ErrorToastProps {
  error: Error;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error }) => {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800"
    >
      <p className="font-semibold">An error occurred.</p>
      <p className="mt-1 text-sm">{error.message}</p>
    </div>
  );
};

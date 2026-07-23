import React from "react";

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center py-8" data-testid="loading-spinner">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
    </div>
  );
};

export default LoadingSpinner;

import React from "react";
import { useManageData } from "./hooks/use-manage-data";
import { ResultTable } from "./result-table";
import LoadingSpinner from "./loading-spinner";
import { ErrorToast } from "./error-toast";

export const SearchResult = (): React.ReactElement | null => {
  const { data, loading, error } = useManageData();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorToast error={{ message: error.message, name: "Error" }} />;
  }

  return data ? <ResultTable data={data} /> : null;
};

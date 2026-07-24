import { BaseTemplate } from "../templates/base-template";
import { SearchForm } from "../components/search-form";
import { SearchResult } from "../components/search-result";
import React from "react";

export interface QueryParams {
  first?: number;
  contentQuery?: string;
  nameQuery?: string;
  positionQuery?: string;
  fromDate?: string;
  toDate?: string;
}

const Search: React.FC = () => {
  return (
    <BaseTemplate>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-4 md:p-5">
            <h2 className="card-title text-base text-neutral">Suche</h2>
            <SearchForm />
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body p-3 md:p-4">
            <h2 className="card-title mb-1 text-base text-neutral">
              Ergebnisse
            </h2>
            <SearchResult />
          </div>
        </div>
      </div>
    </BaseTemplate>
  );
};

export default Search;

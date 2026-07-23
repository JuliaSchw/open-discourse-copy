import { BaseTemplate } from "../templates/base-template";
import { SearchForm } from "../components/search-form";
import { SearchResult } from "../components/search-result";
import React from "react";
import DefaultContainer from "../components/default-components/default-container";

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
      <div className="flex flex-col">
        <DefaultContainer size="l">
          <SearchForm />
          <SearchResult />
        </DefaultContainer>
      </div>
    </BaseTemplate>
  );
};

export default Search;

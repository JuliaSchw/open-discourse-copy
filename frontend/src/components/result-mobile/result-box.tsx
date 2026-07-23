import { SearchResultRow } from "../hooks/use-manage-data";
import React from "react";
import { SpeechModal } from "../speech-modal";
import DefaultText from "../default-components/default-text";

interface ResultBoxProps {
  data: SearchResultRow;
  pageSize?: number;
}

export const ResultBox = ({ data }: ResultBoxProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const datestring = data.date && new Date(data.date).toLocaleDateString();
  return (
    <>
      <div className="flex max-w-full flex-col justify-between rounded-md border border-gray-300 bg-gray-200 p-3 md:max-w-[47vw] md:p-4 lg:p-5 xl:p-5">
        <DefaultText className="font-bold">
          {" "}
          {data.firstName + " " + data.lastName} ({data.abbreviation}) -{" "}
          {data.positionShort}
          {datestring ? <>, am {datestring}</> : null}:
        </DefaultText>
        <DefaultText className="line-clamp-4 md:line-clamp-6">
          {data.speechContent}
        </DefaultText>

        <button
          className="rounded bg-pink-500 px-3 py-2 text-sm font-semibold text-white"
          onClick={() => setIsOpen(true)}
        >
          Mehr
        </button>
      </div>
      <SpeechModal
        data={data}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

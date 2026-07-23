import { SearchResultRow } from "./hooks/use-manage-data";
import React from "react";
import DefaultText from "./default-components/default-text";

export interface SpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SearchResultRow;
}

export const SpeechModal = ({ isOpen, onClose, data }: SpeechModalProps) => {
  if (!isOpen) return null;

  const datestring = data.date && new Date(data.date).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <DefaultText className="mb-0 font-bold">Redebeitrag</DefaultText>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-pink-500 px-3 py-1 text-sm text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {data.documentUrl && (
            <a
              className="font-bold text-pink-500"
              href={data.documentUrl}
              target="_blank"
              rel="noreferrer"
            >
              Zum Plenarprotokoll
            </a>
          )}
          <p className="font-bold">
            {data.firstName} {data.lastName} ({data.abbreviation})
          </p>
          <p className="font-bold">{data.positionShort}</p>
          <p className="font-bold">{datestring}</p>
          <p className="whitespace-pre-line">{data.speechContent}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-pink-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useReducer } from "react";
import { SearchResultRow } from "../hooks/use-manage-data";
import { DownloadButton } from "./download-button";
import { positions } from "../search-form";
import { SpeechModal } from "../speech-modal";
import NextAppLink from "../next-link";
import { ReactTable } from "../react-table";

interface ResultTableProps {
  data: SearchResultRow[];
}

interface Row {
  values: SearchResultRow;
}

type SelectedState = { [id: number]: boolean };
type SelectedAction = {
  action: "toggleSingle";
  id: number;
};

export const convertPosition = (position: string) => {
  return positions.find((element) => element.key == position)?.label || "";
};

const SpeechCell = ({ row }: { row: Row }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!(row.values.speechContent || row.values.speechContent === "")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-bold text-pink-500"
      >
        anzeigen
      </button>
      <SpeechModal
        data={row.values}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export const ResultTable = ({ data }: ResultTableProps) => {
  const [selected, dispatchSelected] = useReducer(
    (currentState: SelectedState, action: SelectedAction): SelectedState => {
      switch (action.action) {
        case "toggleSingle":
          return {
            ...currentState,
            [action.id]: !currentState[action.id],
          };
      }
    },
    Object.fromEntries(data.map((element) => [element.downloadId, false])),
  );

  const columns = [
    {
      Header: "Herunterladen",
      accessor: "downloadId",
      Cell: ({ row }: { row: Row }) => {
        if (row.values.downloadId || row.values.downloadId === 0) {
          return (
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
              checked={selected[row.values.downloadId]}
              onChange={() => {
                dispatchSelected({
                  action: "toggleSingle",
                  id: row.values.downloadId,
                });
              }}
            />
          );
        }
        return null;
      },
    },
    {
      Header: "ID",
      accessor: "id",
    },
    { Header: "Vorname", accessor: "firstName" },
    { Header: "Nachname", accessor: "lastName" },
    { Header: "Fraktion", accessor: "abbreviation" },
    { Header: "Position", accessor: "positionShort" },
    {
      Header: "Date",
      accessor: "date",
      Cell: ({ row }: { row: Row }) => {
        if (row.values.date) {
          return <span>{new Date(row.values.date).toLocaleDateString()}</span>;
        }
        return null;
      },
    },
    {
      Header: "Url",
      accessor: "documentUrl",
      Cell: ({ row }: { row: Row }) => {
        if (row.values.documentUrl) {
          return (
            <NextAppLink
              href={row.values.documentUrl}
              isExternal
              className="font-bold text-pink-500"
            >
              Protokoll
            </NextAppLink>
          );
        }
        return null;
      },
    },
    {
      Header: "Rede",
      accessor: "speechContent",
      Cell: ({ row }: { row: Row }) => {
        return <SpeechCell row={row} />;
      },
    },
  ];
  return (
    <>
      <ReactTable
        columns={columns}
        data={data.map((element) => {
          return {
            ...element,
            abbreviation:
              element.abbreviation == "not found"
                ? "Ohne Zurodnung"
                : element.abbreviation,
            positionShort: convertPosition(element.positionShort),
          };
        })}
        pageSize={10}
      />
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <DownloadButton data={data} text={"Alle Ergebnisse Herunterladen"} />
        {Object.entries(selected).some(([_id, state]) => state) ? (
          <DownloadButton
            data={data.filter((element) => selected[element.downloadId])}
            text={"Ausgewählte Ergebnisse Herunterladen"}
          />
        ) : null}
      </div>
    </>
  );
};

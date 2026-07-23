import React from "react";
import { Check, X } from "react-feather";
import { UpdateDataProps } from "./use-inline-edit";

export interface EditableCellProps {
  value: string | number;
  row: { index: number };
  column: { id: string };
  updateData: ({ rowIndex, columnId, value }: UpdateDataProps) => void;
}

export interface EditableControlsProps {
  isEditing: boolean;
}

export const EditableCell = ({
  value: initialValue,
  row,
  column: { id },
  updateData,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);

  const onSubmit = (newValue: string | number) => {
    updateData({ value: newValue, rowIndex: row.index, columnId: id });
  };

  return isEditing ? (
    <div className="flex items-center gap-2">
      <input
        value={value}
        className="w-full min-w-[120px] rounded border border-gray-300 px-2 py-1 text-sm"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setValue(event.target.value)
        }
      />
      <button
        type="button"
        className="rounded border border-green-300 p-1 text-green-700 hover:bg-green-50"
        onClick={() => {
          onSubmit(value);
          setIsEditing(false);
        }}
        aria-label="Save"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        className="rounded border border-gray-300 p-1 text-gray-700 hover:bg-gray-100"
        onClick={() => {
          setValue(initialValue);
          setIsEditing(false);
        }}
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="cursor-text text-left"
    >
      {initialValue}
    </button>
  );
};

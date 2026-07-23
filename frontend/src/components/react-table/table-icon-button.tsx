import React from "react";
type TableIconButtonProps = {
  icon?: React.ReactNode;
  onClick:
    | ((event: React.MouseEvent<HTMLElement, MouseEvent>) => void)
    | undefined;
  isDisabled: boolean;
};
export const TableIconButton: React.FC<TableIconButtonProps> = ({
  icon,
  onClick,
  isDisabled,
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      {...rest}
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Table Icon button"
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon || children}
    </button>
  );
};

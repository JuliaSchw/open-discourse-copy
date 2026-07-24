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
      className="btn btn-sm btn-square btn-outline"
    >
      {icon || children}
    </button>
  );
};

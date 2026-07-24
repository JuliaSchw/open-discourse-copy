import React from "react";

export interface DefaultButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  marginY?: string;
  mt?: number;
  rightIcon?: React.ReactNode;
}

export const DefaultButton: React.FC<DefaultButtonProps> = ({
  children,
  className = "",
  rightIcon,
  mt,
  marginY,
  ...props
}) => {
  return (
    <button
      className={`btn btn-primary inline-flex items-center rounded-md text-sm font-semibold uppercase tracking-wide ${className}`}
      style={{ marginTop: mt ? `${mt}px` : marginY ? marginY : "0.75rem" }}
      {...props}
    >
      <span>{children}</span>
      {rightIcon === undefined ? (
        <span className="ml-2">→</span>
      ) : rightIcon ? (
        <span className="ml-2">{rightIcon}</span>
      ) : (
        <></>
      )}
    </button>
  );
};
export default DefaultButton;

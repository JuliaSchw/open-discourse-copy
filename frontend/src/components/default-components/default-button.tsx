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
      className={`inline-flex items-center rounded bg-pink-500 px-4 py-2 text-sm font-semibold uppercase text-white transition hover:bg-pink-600 ${className}`}
      style={{ marginTop: mt ? `${mt}px` : marginY ? marginY : "0.75rem" }}
      {...props}
    >
      <span>{children}</span>
      {rightIcon ? (
        <span className="ml-2">{rightIcon}</span>
      ) : (
        <span className="ml-2">→</span>
      )}
    </button>
  );
};
export default DefaultButton;

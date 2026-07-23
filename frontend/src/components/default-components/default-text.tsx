import React from "react";

export interface DefaultTextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const DefaultText: React.FC<DefaultTextProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <p
      className={`mb-4 text-sm sm:text-xl md:text-2xl lg:text-2xl xl:text-4xl ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};
export default DefaultText;

import React from "react";

export interface DefaultContainerProps {
  size: "s" | "m" | "l" | "xl";
  children: React.ReactNode;
}

const containerClasses = {
  s: "w-full max-w-[400px] md:max-w-[500px] lg:max-w-[850px] xl:max-w-[60vw]",
  m: "w-full max-w-[500px] md:max-w-[600px] lg:max-w-[1050px] xl:max-w-[65vw]",
  l: "w-full max-w-[500px] md:max-w-[900px] lg:max-w-[1250px] xl:max-w-[70vw]",
  xl: "w-full max-w-[500px] md:max-w-[900px] lg:max-w-[1400px] xl:max-w-[80vw]",
};

export const DefaultContainer: React.FC<DefaultContainerProps> = ({
  size,
  children,
}) => {
  return <div className={`mx-auto ${containerClasses[size]}`}>{children}</div>;
};
export default DefaultContainer;

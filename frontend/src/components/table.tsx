import React from "react";

type GenericProps<T> = React.PropsWithChildren<T> & {
  className?: string;
  bg?: string;
};

const mapBg = (bg?: string) => {
  if (bg === "gray.100") return "bg-gray-100";
  if (bg === "gray.200") return "bg-gray-200";
  return "";
};

export const Table: React.FC<
  GenericProps<React.TableHTMLAttributes<HTMLTableElement>>
> = ({ children, className, ...rest }) => {
  return (
    <table
      className={`w-full table-fixed border-collapse ${className || ""}`}
      {...rest}
    >
      {children}
    </table>
  );
};

export const Thead: React.FC<
  GenericProps<React.HTMLAttributes<HTMLTableSectionElement>>
> = ({ children, className, ...rest }) => {
  return (
    <thead className={className} {...rest}>
      {children}
    </thead>
  );
};

export const Tbody: React.FC<
  GenericProps<React.HTMLAttributes<HTMLTableSectionElement>>
> = ({ children, className, ...rest }) => {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
};

export const Tfoot: React.FC<
  GenericProps<React.HTMLAttributes<HTMLTableSectionElement>>
> = ({ children, className, ...rest }) => {
  return (
    <tfoot className={className} {...rest}>
      {children}
    </tfoot>
  );
};

export const Th: React.FC<
  GenericProps<React.ThHTMLAttributes<HTMLTableCellElement>>
> = ({ children, className, bg, ...rest }) => {
  return (
    <th
      className={`border-b border-gray-200 p-4 text-left ${mapBg(bg)} ${className || ""}`}
      {...rest}
    >
      {children}
    </th>
  );
};

export const Tr: React.FC<
  GenericProps<React.HTMLAttributes<HTMLTableRowElement>>
> = ({ children, className, bg, ...rest }) => {
  return (
    <tr className={`${mapBg(bg)} ${className || ""}`} {...rest}>
      {children}
    </tr>
  );
};

export const Td: React.FC<
  GenericProps<React.TdHTMLAttributes<HTMLTableCellElement>>
> = ({ children, className, ...rest }) => {
  return (
    <td
      className={`border-b border-gray-200 p-4 align-top ${className || ""}`}
      {...rest}
    >
      {children}
    </td>
  );
};

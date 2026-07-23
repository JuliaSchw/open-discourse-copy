import React, { PropsWithChildren } from "react";
import NextLink from "next/link";
import { LinkProps as NextLinkProps } from "next/dist/client/link";

type AnchorLikeProps = {
  isExternal?: boolean;
  rel?: string;
  className?: string;
  fontWeight?: "normal" | "bold" | number;
  target?: string;
};

export type NextAppLinkProps = PropsWithChildren<
  NextLinkProps & AnchorLikeProps
>;

export const NextAppLink = ({
  href,
  as,
  replace,
  scroll,
  shallow,
  prefetch,
  children,
  isExternal,
  rel,
  className,
  fontWeight,
  ...linkProps
}: NextAppLinkProps) => {
  return (
    <NextLink
      passHref={true}
      href={href}
      as={as}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      prefetch={prefetch}
    >
      <a
        target={isExternal ? "_blank" : linkProps.target}
        rel={isExternal ? "noopener noreferrer" : rel}
        className={className}
        style={fontWeight ? { fontWeight } : undefined}
      >
        {children}
      </a>
    </NextLink>
  );
};

export default NextAppLink;

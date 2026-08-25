import { ViewTransition } from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition enter="page-enter" default="none">
      {children}
    </ViewTransition>
  );
}

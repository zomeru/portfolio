import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Nav, Footer, Loader } from ".";
import { StyledLayout } from "../styles/componentStyles";

interface ILayoutProps {
  children: React.ReactNode;
  isHome: boolean;
}

const Layout: React.FC<ILayoutProps> = ({ children, isHome }) => {
  const [loading, setLoading] = useState<boolean>(true);

  return (
    <StyledLayout id="root">
      <AnimatePresence>
        {loading && isHome && (
          <Loader finishLoading={() => setLoading(false)} />
        )}
      </AnimatePresence>

      {!loading && (
        <React.Fragment>
          <Nav isHome={isHome} />
          <main>{children}</main>
          <Footer />
        </React.Fragment>
      )}
    </StyledLayout>
  );
};

export default Layout;

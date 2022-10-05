import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Nav, Footer, Loader } from ".";
import { StyledLayout } from "../styles/componentStyles";
import useTabActive from "@/hooks/useTabActive";

interface ILayoutProps {
  children: React.ReactNode;
  isHome: boolean;
}

const Layout: React.FC<ILayoutProps> = ({ children, isHome }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const isTabActive = useTabActive();

  useEffect(() => {
    if (isTabActive) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 2500);
    }
  }, [isLoaded, isHome, isTabActive]);

  return (
    <StyledLayout id="root">
      <AnimatePresence>
        {!isLoaded && isHome && (
          <motion.div
            exit={{
              opacity: 0,
              transition: {
                ease: "easeInOut",
                duration: 0.5,
              },
            }}
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoaded && isHome && (
        <>
          <Nav isHome={isHome} />
          <main>{children}</main>
          <Footer />
        </>
      )}
    </StyledLayout>
  );
};

export default Layout;

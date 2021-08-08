import React, { useState, useEffect } from 'react';
import { Nav, Footer, Loader } from '.';
import { StyledLayout } from '../styles/componentStyles';
import { AnimatePresence, motion } from 'framer-motion';

interface ILayoutProps {
  children: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Layout: React.FC<ILayoutProps> = ({
  children,
  theme,
  toggleTheme,
  isHome,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 3500);
  }, []);

  const loaderVar = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
      y: 300,
      transition: {
        ease: 'easeInOut',
        duration: 1,
      },
    },
  };

  return (
    <StyledLayout id='root'>
      {/* <AnimatePresence>
        {!isLoaded && (
          <motion.div
            exit={{
              opacity: 0,
              transition: {
                ease: 'easeInOut',
                duration: 0.5,
              },
            }}
          >
            <Loader />
          </motion.div>
        )}
      </AnimatePresence> */}
      {true && (
        <>
          <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
          <main>{children}</main>
          <Footer />
        </>
      )}
    </StyledLayout>
  );
};

export default Layout;

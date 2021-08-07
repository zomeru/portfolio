import React, { useState, useEffect } from 'react';
import { Nav, Footer, Loader } from '.';
import { StyledLayout } from '../styles/componentStyles';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [notLoaded, setNotLoaded] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);

      if (isLoaded) {
        setTimeout(() => {
          setNotLoaded(false);
        }, 1000);
      }
    }, 4000);
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
      transition: {
        duration: 1.5,
        ease: [0.25, -0.77, 0.81, 0.68],
      },
    },
  };

  return (
    <StyledLayout id='root'>
      <AnimatePresence>
        {!isLoaded && (
          <Loader
            variants={loaderVar}
            initial='initial'
            animate='animate'
            exit='exit'
            notLoaded={notLoaded}
            isLoaded={isLoaded}
          />
        )}
      </AnimatePresence>
      {isLoaded && (
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

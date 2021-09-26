import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Nav, Footer, Loader } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface ILayoutProps {
  children: React.ReactNode;
  isHome: boolean;
}

const Layout: React.FC<ILayoutProps> = ({ children, isHome }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    /* Automatically jump to section
     ** based on hash (if there is any)
     ** when you came from another page
     */
    if (window.location.hash && isLoaded && isHome) {
      const yOffset = window.location.hash === '#contact' ? -50 : -650;
      const element = document.getElementById(
        `${window.location.hash.substring(1)}`
      );
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    setTimeout(() => {
      setIsLoaded(true);
    }, 2500);
  }, [isLoaded, isHome]);

  return (
    <StyledLayout id='root'>
      <AnimatePresence>
        {!isLoaded && isHome && (
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

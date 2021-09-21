import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Nav, Footer, Loader } from '.';
import { StyledLayout } from '../styles/componentStyles';
import { CustomSeoProps } from '../configs/types';

interface ILayoutProps {
  children: React.ReactNode;
  isHome: boolean;
  // curScrollPos: number;
  // prevScrollPos: number;
  seo?: CustomSeoProps;
}

const Layout: React.FC<ILayoutProps> = ({
  children,
  isHome,
  // prevScrollPos,
  // curScrollPos,
  seo,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 2500);
  }, []);

  return (
    <StyledLayout id='root'>
      {/* <AnimatePresence>
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
      </AnimatePresence> */}

      {true && isHome && (
        <>
          <Nav
            isHome={isHome}
            // prevScrollPos={prevScrollPos}
            // curScrollPos={curScrollPos}
          />
          <main>{children}</main>
          <Footer />
        </>
      )}
    </StyledLayout>
  );
};

export default Layout;

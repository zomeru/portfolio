import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useWindowDimensions from '../hooks/useWindowDimensions';
import { Nav, Footer, Loader } from '.';
import { StyledLayout } from '../styles/componentStyles';

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

  const { width, height } = useWindowDimensions();

  const date = new Date();
  const isMyBirthday = date.getMonth() + 1 === 8 && date.getDate() === 19;

  useEffect(() => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 2450);
  }, []);

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

      {/* {isLoaded && isHome} */}
      {isLoaded && isHome && (
        <>
          {/* DISPLAY CONFETTI WHEN IT'S MY BIRTHDAY */}
          {isMyBirthday && (
            <div style={{ position: 'fixed', zIndex: 9999, left: 0 }}>
              <Confetti
                width={width}
                height={height}
                numberOfPieces={150}
                gravity={0.07}
                opacity={0.9}
              />
            </div>
          )}

          <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
          <main>{children}</main>
          <Footer />
        </>
      )}
    </StyledLayout>
  );
};

export default Layout;

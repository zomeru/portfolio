import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useWindowDimensions from '../hooks/useWindowDimensions';
import { Nav, Footer, Loader, Birthday } from '.';
import { StyledLayout } from '../styles/componentStyles';

interface ILayoutProps {
  children: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

// Check if it's my birthday
// August 19th
const date = new Date();
const isMyBirthday = date.getMonth() + 1 === 8 && date.getDate() === 19;

const Layout: React.FC<ILayoutProps> = ({
  children,
  theme,
  toggleTheme,
  isHome,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isBdayLoaded, SetIsBdayLoaded] = useState<boolean>(
    isMyBirthday ? false : true
  );
  const [isTabActive, setIsTabActive] = useState<boolean>(false);

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (isTabActive) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 2500);
    }

    if (!isTabActive && !document.hidden) {
      setIsTabActive(true);
    }
  }, [isTabActive]);

  if (isLoaded && isMyBirthday) {
    setTimeout(() => {
      SetIsBdayLoaded(true);
    }, 2000);
  }

  return (
    <StyledLayout id='root'>
      <AnimatePresence>
        {isTabActive && !isLoaded && isHome && (
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

        {isLoaded && !isBdayLoaded && <Birthday />}
      </AnimatePresence>

      {/* {isLoaded && isHome} */}
      {isLoaded && isBdayLoaded && isHome && (
        <>
          {/* DISPLAY CONFETTI WHEN IT'S MY BIRTHDAY */}
          {isMyBirthday && (
            <div style={{ position: 'fixed', zIndex: 9999, left: 0 }}>
              <Confetti
                width={width}
                height={height}
                numberOfPieces={100}
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

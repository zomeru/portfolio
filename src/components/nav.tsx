//@ts-nocheck
import React, { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { navLinks } from '../configs/data';
import ToggleTheme from './ToggleTheme';
import Menu from './menu';
import { StyledNav, StyledLinks } from '../styles/componentStyles';
import { ThemeModeContext } from '../contexts/ThemeModeContext';

interface INavProps {
  isHome: boolean;
}

const Nav: React.FC<INavProps> = ({ isHome }) => {
  const { theme, toggleTheme } = useContext(ThemeModeContext);

  const [open, setOpen] = useState<boolean>(false);
  const [hostURL, setHostURL] = useState<string>('');

  const [prevScrollPos, setPrevScrollPos] = useState<number>(1);
  const [curScrollPos, setCurScrollPos] = useState<number>(0);

  useEffect(() => {
    setCurScrollPos(window.pageYOffset);
    window.onscroll = function () {
      const e = window.pageYOffset;
      setCurScrollPos(e);
      setPrevScrollPos(curScrollPos);
    };
  }, [curScrollPos]);

  const openHamburger = () => {
    setOpen(open => !open);
  };

  //? ANIMATIONS
  const navVariants: Variants = {
    hidden: { opacity: isHome ? 0 : 1 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        staggerChildren: 0.1,
        when: 'beforeChildren',
      },
    },
  };

  const navItemVariants: Variants = {
    hidden: {
      y: isHome ? -20 : 0,
      opacity: isHome ? 0 : 1,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: 'easeInOut',
        duration: 0.2,
      },
    },
  };

  useEffect(() => {
    setHostURL(`${window.location.protocol}//${window.location.host}`);
  }, []);

  const Logo = () =>
    isHome ? (
      <a href={hostURL}>Zomer</a>
    ) : (
      <Link href='/' passHref>
        <a>Zomer</a>
      </Link>
    );

  const [innerText, setInnerText] = useState('');

  const activeLinkHandler = e => {
    console.log(e.target.innerText);
    setInnerText(e.target.innerText);
  };

  return (
    <StyledNav
      id='nav'
      prevScrollPos={prevScrollPos}
      curScrollPos={curScrollPos}
    >
      <motion.nav variants={navVariants} initial='hidden' animate='visible'>
        <motion.span className='logo' variants={navItemVariants}>
          <Logo />
        </motion.span>
        <StyledLinks>
          <ul>
            {navLinks.map((link, i) => {
              const { name, url } = link;

              return (
                <motion.li
                  onClick={activeLinkHandler}
                  variants={navItemVariants}
                  key={i}
                >
                  <Link href={url}>
                    <a
                      className={`link ${
                        name === innerText ? 'active-link' : ''
                      }`}
                    >
                      {name}
                    </a>
                  </Link>
                </motion.li>
              );
            })}
            <motion.li
              onClick={activeLinkHandler}
              key={navLinks.length}
              variants={navItemVariants}
            >
              <ToggleTheme theme={theme} toggleTheme={toggleTheme} />
            </motion.li>
          </ul>
        </StyledLinks>
        <Menu
          variants={navItemVariants}
          theme={theme}
          toggleTheme={toggleTheme}
          open={open}
          openHamburger={openHamburger}
        />
      </motion.nav>
    </StyledNav>
  );
};

export default Nav;

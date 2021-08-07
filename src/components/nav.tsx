import React from 'react';
import { navLinks } from '../configs/data';
import { StyledNav, StyledLogo, StyledLinks } from '../styles/componentStyles';
import ToggleTheme from './ToggleTheme';
import Menu from './menu';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface INavProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Nav: React.FC<INavProps> = ({ theme, toggleTheme, isHome }) => {
  const [open, setOpen] = React.useState<boolean>(false);

  const openHamburger = () => {
    setOpen(open => !open);
  };

  const Logo = isHome ? (
    <a href='https://zomergregorio.live'>Zomeru</a>
  ) : (
    <Link href='/'>
      <a>Zomeru</a>
    </Link>
  );

  //? ANIMATIONS
  const logoVar = {
    initial: {
      opacity: 0,
      y: -20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <StyledNav>
      <nav>
        <StyledLogo variants={logoVar} initial='initial' animate='animate'>
          {Logo}
        </StyledLogo>
        <StyledLinks>
          <ul>
            {navLinks.map((link, i) => (
              <motion.li
                initial={{ opacity: 0, y: -20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: 0.5 + i * 0.1,
                    ease: 'easeInOut',
                  },
                }}
                key={link.name}
              >
                <Link href={link.url}>{link.name}</Link>
              </motion.li>
            ))}
            <li>
              <ToggleTheme theme={theme} toggleTheme={toggleTheme} />
            </li>
          </ul>
        </StyledLinks>
        <Menu
          theme={theme}
          toggleTheme={toggleTheme}
          open={open}
          openHamburger={openHamburger}
        />
      </nav>
    </StyledNav>
  );
};

export default Nav;

import React from 'react';
import { navLinks } from '../configs/data';
import { StyledNav, StyledLinks } from '../styles/componentStyles';
import ToggleTheme from './ToggleTheme';
import Menu from './menu';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

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

  //? ANIMATIONS
  const navVariants: Variants = {
    hidden: { opacity: isHome ? 0 : 1 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        staggerChildren: 0.2,
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
        duration: 0.3,
      },
    },
  };

  const Logo = () =>
    isHome ? (
      <a href='https://zomergregorio.live'>zoms</a>
    ) : (
      <Link href='/' passHref>
        <a>Zoms</a>
      </Link>
    );

  return (
    <StyledNav>
      <motion.nav variants={navVariants} initial='hidden' animate='visible'>
        <motion.span className='logo' variants={navItemVariants}>
          <Logo />
        </motion.span>
        <StyledLinks>
          <ul>
            {navLinks.map((link, i) => (
              <motion.li variants={navItemVariants} key={link.name}>
                <Link href={link.url}>{link.name}</Link>
              </motion.li>
            ))}
            <motion.li variants={navItemVariants}>
              <ToggleTheme theme={theme} toggleTheme={toggleTheme} />
            </motion.li>
          </ul>
        </StyledLinks>
        <Menu
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

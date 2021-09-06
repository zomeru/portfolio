import React from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { navLinks } from '../configs/data';
import ToggleTheme from './ToggleTheme';
import Menu from './menu';
import { StyledNav, StyledLinks } from '../styles/componentStyles';

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

  const hostURL = `${window.location.protocol}//${window.location.host}`;

  const Logo = () =>
    isHome ? (
      <a href={hostURL}>Zomer</a>
    ) : (
      <Link href='/' passHref>
        <a>Zomer</a>
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
            {navLinks.map(link => {
              const { name, url } = link;

              const isHashLink = url.startsWith('/#');

              return (
                <motion.li variants={navItemVariants} key={name}>
                  {isHashLink ? (
                    <Link href={url}>
                      <a className='link'>{name}</a>
                    </Link>
                  ) : (
                    <a
                      className='link'
                      href={`${hostURL}${url}`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      {name}
                    </a>
                  )}
                </motion.li>
              );
            })}
            <motion.li variants={navItemVariants}>
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

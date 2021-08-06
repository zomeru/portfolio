import React from 'react';
import { navLinks } from '../data';
import { StyledNav, StyledLogo, StyledLinks } from '../styles/componentStyles';
import ToggleTheme from './ToggleTheme';
import Menu from './menu';
import Link from 'next/link';

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

  return (
    <StyledNav>
      <nav>
        <StyledLogo>{Logo}</StyledLogo>
        <StyledLinks>
          <ul>
            {navLinks.map(link => (
              <li key={link.name}>
                <Link href={link.url}>{link.name}</Link>
              </li>
            ))}
            <ToggleTheme theme={theme} toggleTheme={toggleTheme} />
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

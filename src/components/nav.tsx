import React from 'react';
import Link from 'next/link';
import { navLinks } from '../data';
import { StyledNav, StyledLogo, StyledLinks } from '../styles/componentStyles';
import { useDarkMode } from '../hooks/useDarkMode';
import ToggleTheme from './ToggleTheme';

interface INavProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const Nav: React.FC<INavProps> = ({ theme, toggleTheme, isHome }) => {
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
      </nav>
    </StyledNav>
  );
};

export default Nav;

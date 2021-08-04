import React from 'react';
import Link from 'next/link';
import { navLinks } from '../data';
import { StyledNav, StyledLogo, StyledLinks } from '../styles/componentStyles';
import { useDarkMode } from '../hooks/useDarkMode';
import ToggleTheme from './ToggleTheme';

interface INavProps {
  theme: any;
  toggleTheme: any;
}

const Nav: React.FC<INavProps> = ({ theme, toggleTheme }) => {
  return (
    <StyledNav>
      <nav>
        <StyledLogo>
          <Link href='/'>
            <a>Zomeru</a>
          </Link>
        </StyledLogo>
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

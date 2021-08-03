import React from 'react';
import Link from 'next/link';
import { navLinks } from '../data';
import { StyledNav, StyledLogo, StyledLinks } from '../styles/componentStyles';

const Nav = () => {
  return (
    <StyledNav>
      <nav>
        <StyledLogo>
          <Link href='/'>Zomeru</Link>
        </StyledLogo>
        <StyledLinks>
          <ul>
            {navLinks.map(link => (
              <li key={link.name}>
                <Link href={link.url}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </StyledLinks>
      </nav>
    </StyledNav>
  );
};

export default Nav;

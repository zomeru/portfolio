import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { navLinks } from '../data';

interface InavProps {}

const StyledNav = styled.nav`
  height: var(--nav-height);
  background-color: var(--color-white);
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* max-width: var(--max-width);
  margin: 0 auto; */
`;

const StyledLogo = styled.h1`
  text-transform: uppercase;
  font-size: var(--fz-sm);

  a {
    transition: color 0.2s ease-out;

    :hover {
      color: var(--blue-dark);
    }
  }
`;

const StyledLinks = styled.div`
  ul {
    display: flex;

    li:not(:last-child) {
      margin-right: var(--mg-xl);
    }
  }

  a {
    font-size: var(--fz-sm);
    font-weight: var(--font-medium);
    transition: color 0.2s ease-out;

    :hover {
      color: var(--blue-dark);
    }
  }
`;

const Nav: React.FC<InavProps> = ({}) => {
  return (
    <StyledNav>
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
    </StyledNav>
  );
};

export default Nav;

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { navLinks } from '../config';

interface InavProps {}

const StyledNav = styled.nav`
  height: 100px;
  background-color: var(--color-gray-light);
  color: var(--color-black);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledLogo = styled.h1`
  text-transform: uppercase;
  font-size: var(--fz-md);

  a {
    text-decoration: none;

    :link,
    :active {
      color: var(--color-black);
    }

    :visited,
    :focus {
      color: var(--color-black);
    }
  }
`;

const StyledLinks = styled.div`
  ul {
    list-style: none;
    display: flex;

    :not(:last-child) {
      margin-right: var(--mg-md);
    }
  }

  a {
    text-decoration: none;
    color: var(--color-black);
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
              <a href={link.url}>{link.name}</a>
            </li>
          ))}
        </ul>
      </StyledLinks>
    </StyledNav>
  );
};

export default Nav;

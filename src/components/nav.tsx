import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { navLinks } from '../config';

interface InavProps {}

const StyledNav = styled.nav`
  height: var(--nav-height);
  background-color: var(--color-white);
  color: var(--color-black);
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* max-width: var(--max-width);
  margin: 0 auto; */
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

    :hover {
      color: var(--color-blue-dark);
      transition: color 0.2s ease-out;
    }
  }
`;

const StyledLinks = styled.div`
  ul {
    list-style: none;
    display: flex;

    li:not(:last-child) {
      margin-right: var(--mg-xl);
    }
  }

  a {
    font-size: var(--fz-md);
    text-decoration: none;
    color: var(--color-black);
    font-weight: var(--font-semibold);

    :hover {
      color: var(--color-blue-dark);
      transition: color 0.2s ease-out;
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
              <a href={link.url}>{link.name}</a>
            </li>
          ))}
        </ul>
      </StyledLinks>
    </StyledNav>
  );
};

export default Nav;

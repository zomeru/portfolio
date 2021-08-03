import styled from 'styled-components';

export const StyledNav = styled.header`
  height: var(--nav-height);
  background-color: var(--color-white);
  display: flex;
  align-items: center;

  nav {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

export const StyledLogo = styled.h1`
  text-transform: uppercase;
  font-size: var(--fz-sm);

  a {
    transition: color 0.2s ease-out;

    :hover {
      color: var(--blue-dark);
    }
  }
`;

export const StyledLinks = styled.div`
  @media only screen and (max-width: 768px) {
    display: none;
  }

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

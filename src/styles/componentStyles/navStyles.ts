import styled from 'styled-components';

export const StyledNav = styled.header`
  height: var(--nav-height);
  background-color: ${({ theme }) => theme.body};
  display: flex;
  align-items: center;

  nav {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  a {
    font-weight: var(--font-medium);
    font-size: var(--fz-sm);
    transition: color 0.2s ease-out;

    :hover {
      color: ${({ theme }) => theme.accentMain};
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
`;

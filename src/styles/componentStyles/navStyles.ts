import styled from 'styled-components';

export const StyledNav = styled.header`
  z-index: 9999;
  display: flex;
  align-items: center;
  max-width: var(--max-width);
  height: var(--nav-height);
  position: relative;
  transition: var(--transition2);
  transition: top 0.2s ease-in-out;

  nav {
    width: 100%;
    height: var(--nav-height);
    background-color: ${({ theme }) => theme.blogTitleCard};
    display: flex;
    justify-content: space-between;
    align-items: center;
    filter: none !important;
    pointer-events: auto !important;
    user-select: auto !important;
    backdrop-filter: blur(10px);
    position: fixed;
    top: ${(props: any) =>
      props.prevScrollPos > props.curScrollPos ? '0' : '-100%'};
    /* transform: translateY(300px); */
    /* transition: var(--transition2); */
    transition: top 0.55s ease-in-out;
  }

  a {
    font-size: var(--fz-sm);
    transition: var(--transition2);

    :hover {
      color: ${({ theme }) => theme.accentMain};
    }
  }
`;

export const StyledLinks = styled.div`
  padding-right: 70px;
  @media only screen and (max-width: 768px) {
    display: none;
  }

  ul {
    display: flex;

    li {
      margin-right: 50px;
    }

    /* li:not(:last-child) {
      margin-right: 50px;
    } */
  }
`;

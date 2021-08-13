import styled from 'styled-components';
import { motion } from 'framer-motion';

export const StyledMenu = styled(motion.div)`
  display: none;
  position: ${(props: any) => (props.menuOpen ? 'fixed' : 'absolute')};
  right: 35px;
  z-index: 99;

  @media only screen and (max-width: 768px) {
    display: block;
  }

  .hamburger-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-35px, -50%);
    width: 35px;
    height: 35px;
    border: 2px solid ${({ theme }) => theme.textMain};
    cursor: pointer;
    z-index: 15;

    :hover {
      border: 2px solid ${({ theme }) => theme.accentMain};
    }

    :hover li {
      background: ${({ theme }) => theme.accentMain};
    }
  }
  .hamburger-button li {
    list-style: none;
    position: absolute;
    left: 10%;
    transform: translate(0, -50%);
    width: 80%;
    height: 4px;
    background: ${(props: any) =>
      props.open ? 'var(--white)' : props.theme.textMain};
    opacity: 1;
    transition: transform 0.3s, top 0.3s, opacity 0.3s;
    transition-delay: 0s, 0.3s, 0.3s;
  }

  ul li:nth-child(1) {
    top: 25%;
  }
  ul li:nth-child(2) {
    top: 50%;
  }
  ul li:nth-child(3) {
    top: 75%;
  }
  ul.active li {
    transition: top 0.3s, transform 0.3s, opacity 0.5s;
    transition-delay: 0s, 0.3s, 0.3s;
  }
  ul.active li:nth-child(1) {
    top: 50%;
    transform: translate(0, -50%) rotate(-45deg);
  }
  ul.active li:nth-child(2) {
    opacity: 0;
  }
  ul.active li:nth-child(3) {
    top: 50%;
    transform: translate(0, -50%) rotate(45deg);
  }

  nav {
    position: fixed;
    z-index: 14;
    top: 0;
    bottom: 0;
    right: 0;
    background: ${({ theme }) => theme.menuNav};
    width: min(75vw, 400px);
    height: 100vh;
    padding-top: 50px;

    .toggle-icon {
      width: 50px;
      height: 50px;
    }

    ul {
      z-index: 88;
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      align-items: center;
      color: ${({ theme }) => theme.textMain};

      a {
        padding: 20px 45px;
        font-size: 25px;
      }
    }
  }
`;

export const StyledSidebar = styled.div`
  position: fixed;
  z-index: 10;
  top: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  transition: var(--transition3);
  background: ${({ theme }) => theme.bgBlur};

  opacity: 0.95;
`;

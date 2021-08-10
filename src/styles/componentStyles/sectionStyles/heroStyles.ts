import styled from 'styled-components';
import { motion } from 'framer-motion';

export const StyledHero = styled.section`
  align-items: center;
  width: 100%;
  max-height: calc(100vh - var(--nav-height));
  max-width: var(--max-width);
`;

export const StyledHeroContainer = styled.div`
  padding: 0 120px;
  height: calc(100% - 50px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media only screen and (max-width: 680px) {
    padding: 0 50px;
  }

  @media only screen and (max-width: 500px) {
    padding: 0 20px;
  }

  @media only screen and (max-width: 400px) {
    padding: 0 0px;
  }
`;

export const StyledHeroContent = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media only screen and (max-width: 1000px) {
    text-align: center;
  }

  h1 {
    font-weight: var(--font-regular);
    font-size: var(--fz-xxl);
    margin-bottom: var(--mg-md);

    @media only screen and (max-width: 600px) {
      font-size: var(--fz-xl);
    }
  }

  h2 {
    margin-left: -8px;
    font-weight: var(--font-bold);
    font-size: clamp(24px, 7vw, 85px);
    margin-bottom: var(--mg-sm);
    position: relative;
    max-width: 720px;
  }

  h3 {
    font-weight: var(--font-bold);
    font-size: clamp(20px, 5vw, 55px);
    margin-bottom: var(--mg-md);
    color: ${({ theme }) => theme.textSecond};

    @media only screen and (max-width: 1000px) {
      margin-left: 0;
    }
  }

  .four {
    max-width: 60%;
    font-weight: var(--font-medium);
    color: ${({ theme }) => theme.textSecond};

    @media only screen and (max-width: 1000px) {
      margin-left: 0;
      max-width: 100%;
    }
  }

  .hero-button {
    margin-top: var(--mg-lg);

    @media only screen and (max-width: 1000px) {
      margin: var(--mg-lg) auto 0 auto;
    }
  }

  .icon-container {
    transform: scale(1);

    :hover {
      transform: scale(2);
    }
  }

  .floating-icons {
    position: absolute;
    animation-name: floating;
    animation-duration: 3s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    width: 80px;
    height: 80px;

    :hover ::after {
      transform: scale(1.4);
    }

    ::after {
      content: '';
      position: absolute;
      border-radius: 100px;
      background-color: ${({ theme }) => theme.floatBG};
      width: 80px;
      height: 80px;
      transition: all 0.2s ease-in-out;
      z-index: -1;
    }

    @media only screen and (max-width: 1000px) {
      display: none;
    }
  }

  .icons {
    z-index: 33;
    width: 40px;
    height: 40px;
    color: ${({ theme }) => theme.textMain};
  }

  .linkedin-loc {
    left: -140px;
    bottom: -10px;
  }

  .github-loc {
    right: 40px;
    bottom: 100px;

    @media only screen and (max-width: 1100px) {
      right: -30px;
    }
  }

  .instagram-loc {
    right: 35%;
    top: -50px;
  }

  @keyframes floating {
    from {
      transform: translate(0, 0px);
    }
    65% {
      transform: translate(0, 15px);
    }
    to {
      transform: translate(0, -0px);
    }
  }
`;

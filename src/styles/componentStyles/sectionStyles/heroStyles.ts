import styled from 'styled-components';

export const StyledHero = styled.section`
  width: 100%;
  max-height: calc(100vh - var(--nav-height));
  max-width: var(--max-width);
`;

export const StyledHeroContainer = styled.div`
  padding: 0 120px;
  padding-bottom: 30px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media only screen and (max-width: 1080px) {
    padding: 0 80px;
  }

  @media only screen and (max-width: 768px) {
    padding: 0 30px 25% 30px;
  }

  @media only screen and (max-width: 600px) {
    padding: 0 20px 30% 20px;
  }

  @media only screen and (max-width: 480px) {
    padding: 0 0 40% 0;
  }
`;

export const StyledHeroContent = styled.div`
  position: relative;
  height: 70%;
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
    /* font-size: 85px; */
    font-size: clamp(24px, 7vw, 85px);
    margin-bottom: var(--mg-sm);
    position: relative;
    max-width: 720px;

    /* :hover {
      color: var(--gray-light);
    }

    :hover::after {
      transform: translate3d(100%, 0, 0);
    }

    ::before {
      content: attr(data-letters);
      position: absolute;
      z-index: 2;
      overflow: hidden;
      color: var(--blue-dark);
      white-space: nowrap;
      width: 0%;
      transition: width 0.4s 0.3s;
    }

    :hover::before {
      width: 100%;
    } */
  }

  h3 {
    margin-left: var(--mg-xl);
    font-weight: var(--font-bold);
    /* font-size: 55px; */
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
    margin-left: var(--mg-xxl);
    color: ${({ theme }) => theme.textSecond};

    @media only screen and (max-width: 1000px) {
      margin-left: 0;
      max-width: 100%;
    }
  }

  .hero-button {
    margin-left: var(--mg-xxl);
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
    background-color: ${({ theme }) => theme.contentBG};
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
    transition: all 0.2s ease-in-out;

    @media only screen and (max-width: 1000px) {
      display: none;
    }

    :hover {
      background-color: ${({ theme }) => theme.contentBGSec};
      width: 100px;
      height: 100px;
    }

    :hover .icon-linkedin {
      color: #0077b5;
    }

    :hover .icon-github {
      color: #211f1f;
    }

    :hover .icon-instagram {
      color: #d6249f;
    }
  }

  .icons {
    width: 40px;
    height: 40px;
    color: ${({ theme }) => theme.textMain};
  }

  .linkedin-loc {
    left: -140px;
    bottom: -35px;
  }

  .github-loc {
    right: -15px;
    bottom: 40px;
  }

  .instagram-loc {
    right: 45%;
    top: -100px;
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

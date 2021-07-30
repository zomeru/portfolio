import React from 'react';
import { Nav, Button } from '../index';
import styled from 'styled-components';
import { AiFillGithub, AiOutlineInstagram } from 'react-icons/ai';
import { IoLogoLinkedin } from 'react-icons/io';

const StyledHero = styled.section`
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  max-width: 1500px;
  margin: 0 auto;
`;

const StyledHeroContent = styled.div`
  padding: 0 120px;
  height: calc(100vh - 100px);
  margin: 0 auto;
  margin-top: -30px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .content-container {
    position: relative;
    height: calc(70%);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  h1 {
    font-weight: var(--font-regular);
    margin-bottom: var(--mg-md);
  }

  h2 {
    margin-left: -8px;
    font-weight: var(--font-regular);
    font-size: 90px;
    margin-bottom: var(--mg-md);
  }

  h3 {
    margin-left: var(--mg-xl);
    font-weight: var(--font-regular);
    font-size: 70px;
    margin-bottom: var(--mg-md);
  }

  .four {
    font-weight: var(--font-medium);
    margin-left: var(--mg-xxl);
  }

  .hero-button {
    margin-left: var(--mg-xxl);
    margin-top: var(--mg-xl);
  }

  .icons {
    width: 40px;
    height: 40px;
    color: var(--color-black);
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
    right: 380px;
    top: -40px;
  }

  .floating-icons {
    width: 80px;
    height: 80px;
    position: absolute;
    animation-name: floating;
    animation-duration: 3s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    background-color: rgba(144, 202, 249, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    transition: all 0.2s ease-in-out;

    :hover {
      background-color: rgba(144, 202, 249, 0.35);
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

const Hero = () => {
  const one = <h1>Hi, I&rsquo;m Zomer Gregorio</h1>;
  const two = <h2> Fullstack Developer</h2>;
  const three = <h3>I create stuff sometimes</h3>;
  const four = (
    <p className='four'>
      A college student and a Full Stack Developer based in the Philippines.
    </p>
  );

  return (
    <StyledHero>
      <Nav />

      <StyledHeroContent>
        <div className='content-container'>
          {one}
          {two}
          {three}
          {four}
          <div className='hero-button'>
            <Button buttonUrl='#contact' buttonText='Say Hello' />
          </div>
          <a
            href='https://linkedin.com/in/zomergregorio'
            target='_blank'
            rel='noreferrer'
            className='floating-icons linkedin-loc'
          >
            <IoLogoLinkedin className='icons icon-linkedin' />
          </a>
          <a
            href='https://github.com/zomeru'
            target='_blank'
            rel='noreferrer'
            className='floating-icons github-loc'
          >
            <AiFillGithub className='icons icon-github' />
          </a>
          <a
            href='https://instagram.com/zomerusama'
            target='_blank'
            rel='noreferrer'
            className='floating-icons instagram-loc'
          >
            <AiOutlineInstagram className='icons icon-instagram' />
          </a>
        </div>
      </StyledHeroContent>
    </StyledHero>
  );
};

export default Hero;

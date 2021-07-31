import React from 'react';
import { AiFillGithub, AiOutlineInstagram } from 'react-icons/ai';
import { IoLogoLinkedin } from 'react-icons/io';
import { Button } from '../index';
import { floatingLinks } from '../../config';
import styled from 'styled-components';

const StyledHero = styled.section`
  width: 100%;
  max-height: calc(100vh - var(--nav-height));
  max-width: 1500px;
`;

const StyledHeroContainer = styled.div`
  padding: 0 120px;
  padding-bottom: 30px;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StyledHeroContent = styled.div`
  position: relative;
  height: calc(70%);
  display: flex;
  flex-direction: column;
  justify-content: center;

  h1 {
    font-weight: var(--font-regular);
    margin-bottom: var(--mg-md);

    span {
      background: linear-gradient(
        to bottom,
        var(--color-blue-dark-o) 0%,
        var(--color-blue-dark-o) 100%
      );
      background-position: 0 100%;
      background-repeat: repeat-x;
      background-size: 4px 1px;
      transition: background-size 0.2s;

      :hover {
        background-size: 4px 35px;
        color: var(--color-white);
      }
    }
  }

  h2 {
    margin-left: -8px;
    font-weight: var(--font-semibold);
    font-size: 90px;
    margin-bottom: var(--mg-sm);
  }

  h3 {
    margin-left: var(--mg-xl);
    font-weight: var(--font-regular);
    font-size: 70px;
    margin-bottom: var(--mg-md);
  }

  .four {
    max-width: 60%;
    font-weight: var(--font-medium);
    margin-left: var(--mg-xxl);
    color: var(--color-gray-mid);
  }

  .hero-button {
    margin-left: var(--mg-xxl);
    margin-top: var(--mg-lg);
  }

  .icon-container {
    transform: scale(1);

    :hover {
      transform: scale(2);
    }
  }

  .floating-icons {
    background-color: rgba(144, 202, 249, 0.25);
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

const Hero = () => {
  const one = (
    <h1>
      Hi, I&rsquo;m <span>Zomer Gregorio</span>
    </h1>
  );
  const two = <h2>Software Engineer</h2>;
  const three = <h3>I create stuff sometimes</h3>;
  const four = (
    <p className='four'>
      A college student and a Software Engineer based in the Philippines.
      React.js enthusiast, and loves building interactive and responsive web
      applications.
    </p>
  );

  const heroTexts = [one, two, three, four];

  const icon1 = <IoLogoLinkedin className='icons icon-linkedin' />;
  const icon2 = <AiFillGithub className='icons icon-github' />;
  const icon3 = <AiOutlineInstagram className='icons icon-instagram' />;

  const iconList = [icon1, icon2, icon3];

  return (
    <StyledHero>
      <StyledHeroContainer>
        <StyledHeroContent>
          {heroTexts.map(text => text)}
          <div className='hero-button'>
            <Button buttonUrl='#contact' buttonText='Say Hello' />
          </div>
          {floatingLinks.map((link, index) => (
            <a
              href={link.url}
              target='_blank'
              rel='noreferrer'
              className={`floating-icons ${link.name}-loc`}
              key={link.name}
            >
              {iconList[index]}
            </a>
          ))}
        </StyledHeroContent>
      </StyledHeroContainer>
    </StyledHero>
  );
};

export default Hero;

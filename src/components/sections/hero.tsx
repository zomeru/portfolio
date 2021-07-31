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
    font-size: var(--fz-xxl);
    margin-bottom: var(--mg-md);

    span {
      position: relative;
      font-weight: var(--font-medium);

      :hover {
        color: #b2b0a9;
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
      }
    }
  }

  h2 {
    margin-left: -8px;
    font-weight: var(--font-bold);
    font-size: 85px;
    margin-bottom: var(--mg-sm);
  }

  h3 {
    margin-left: var(--mg-xl);
    font-weight: var(--font-regular);
    font-size: 65px;
    margin-bottom: var(--mg-md);
    color: var(--gray-light);
  }

  .four {
    max-width: 65%;
    font-weight: var(--font-medium);
    margin-left: var(--mg-xxl);
    color: var(--gray-light);
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
    color: var(--gray-dark);
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

const Hero = () => {
  const one = (
    <h1>
      Hi, I&rsquo;m <span data-letters='Zomer Gregorio'>Zomer Gregorio</span>
    </h1>
  );
  const two = <h2>Software Engineer</h2>;
  const three = <h3>I create stuff sometimes</h3>;
  const four = (
    <p className='four'>
      A college student and Software Engineer based in the Philippines. React.js
      enthusiast and loves building interactive and responsive web applications.
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

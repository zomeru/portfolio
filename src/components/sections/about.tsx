import React from 'react';
import Image from 'next/image';
import { TechStacks } from '../index';
import styled from 'styled-components';
import zoms from '../../assets/images/zoms.jpg';

const StyledAbout = styled.section`
  max-width: 1000px;
  padding: 50px;
`;

const StyledAboutContent = styled.div`
  display: flex;
  justify-content: space-evenly;

  .image-wrapper {
    position: relative;
    width: 300px;
    height: 422px;
  }

  .about-image {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .grayscale {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
    width: 100%;
    height: 100%;
    background-color: gray;
    /* -webkit-filter: grayscale(1);
    filter: grayscale(1); */
    mix-blend-mode: saturation;
    opacity: 1;
    transition: all 0.3s ease-in-out;

    :hover {
      opacity: 0;
    }
  }

  .about-text {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    h3 {
      font-size: 40px;
      font-weight: var(--font-light);
      margin-bottom: var(--mg-sm);
    }

    h4 {
      text-transform: uppercase;
      font-size: var(--fz-md);
      margin-bottom: var(--mg-lg);
    }

    p {
      font-weight: var(--font-medium);
      color: var(--color-gray-mid);
    }
  }
`;

interface IaboutProps {}

const About: React.FC<IaboutProps> = ({}) => {
  return (
    <StyledAbout id='about'>
      <h2 className='section-heading'>About</h2>
      <StyledAboutContent>
        <div className='image-wrapper'>
          <Image
            className='about-image'
            src={zoms}
            alt='Zomer Photo'
            width={300}
            height={422}
            placeholder='blur'
          />
          <div className='grayscale' />
        </div>
        <div className='about-text'>
          <h3>Zomer Gregorio</h3>
          <h4>Self-taught Web Developer</h4>
          <p>
            Hello! I am highly motivated, passionate, and self-taught web
            developer. I&rsquo;m currently pursuing a bachelors degree in
            Information Technology (3rd Year) from STI College. I mostly work on
            personal projects and sometimes on freelance projects.
          </p>
        </div>
      </StyledAboutContent>
      <TechStacks />
    </StyledAbout>
  );
};

export default About;

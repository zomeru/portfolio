import React from 'react';
import Image from 'next/image';
import { TechStacks } from '../index';
import styled from 'styled-components';
import zoms from '../../assets/images/zoms.jpg';
import zomsSquare from '../../assets/images/zoms-square.jpg';

const StyledAbout = styled.section`
  max-width: 1000px;
  padding: 40px 100px;
  height: auto;

  @media only screen and (max-width: 1000px) {
    padding: 40px 50px;
  }

  @media only screen and (max-width: 900px) {
    padding: 40px 0px;
  }
`;

const StyledAboutContent = styled.div`
  display: flex;
  justify-content: space-between;

  @media only screen and (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    align-items: center;
  }

  .image-wrapper {
    position: relative;
    width: 300px;
    height: 422px;
    border-radius: var(--bdr-md);
    overflow: hidden;

    @media only screen and (max-width: 768px) {
      display: none;
    }
  }

  .image-wrapper-square {
    position: relative;
    width: 300px;
    height: 300px;
    border-radius: var(--bdr-md);
    overflow: hidden;
    margin-top: 50px;

    @media only screen and (max-width: 768px) {
      display: none;
    }

    @media only screen and (max-width: 480px) {
      width: 230px;
      height: 230px;
    }

    @media only screen and (max-width: 400px) {
      width: 200px;
      height: 200px;
    }

    @media only screen and (max-width: 330px) {
      width: 170px;
      height: 170px;
    }
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
    mix-blend-mode: saturation;
    opacity: 1;
    transition: all 0.3s ease-in-out;

    :hover {
      opacity: 0;
    }
  }

  .hidden-image {
    display: none;

    @media only screen and (max-width: 768px) {
      display: block;
    }
  }

  .about-text {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media only screen and (max-width: 768px) {
      width: 100%;
    }

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
      color: var(--gray-light);
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
            alt='Zomer Gregorio Photo'
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
        <div className='image-wrapper-square hidden-image'>
          <Image
            className='about-image'
            src={zomsSquare}
            width={300}
            height={300}
            alt='Zomer Gregorio Photo'
            placeholder='blur'
          />
          <div className='grayscale' />
        </div>
      </StyledAboutContent>
      <TechStacks />
    </StyledAbout>
  );
};

export default About;

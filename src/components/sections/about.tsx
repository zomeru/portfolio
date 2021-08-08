import React from 'react';
import Image from 'next/image';
import { TechStacks } from '../index';
import zoms from '../../assets/images/zoms.jpg';
import zomsSquare from '../../assets/images/zoms-square.jpg';
import { StyledAbout, StyledAboutContent } from '../../styles/componentStyles';

const About = () => {
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
            developer. I&rsquo;m a college student and currently pursuing a
            bachelors degree in Information Technology (3rd Year) from STI
            College Alabang. My main focus as of now is building responsive and
            beautiful looking web applications. I mostly work on personal
            projects and sometimes on freelance projects.
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

import React from 'react';
import Image from 'next/image';
import zoms from '../../assets/images/zoms.jpg';
import zomsSquare from '../../assets/images/zoms-square.jpg';
import { motion } from 'framer-motion';
import useScrollReveal from '../../hooks/useScrollReveal';
import {
  parentVar,
  fadeUp,
  fadeLeft,
  fadeUpDelay,
} from '../../configs/animations';
import { TechStacks } from '../index';
import { StyledAbout, StyledAboutContent } from '../../styles/componentStyles';

const About = () => {
  const [ref, controls] = useScrollReveal(-250);

  return (
    <StyledAbout
      variants={parentVar}
      initial='hidden'
      animate='visible'
      id='about'
    >
      <motion.h2
        ref={ref}
        variants={fadeUp}
        animate={controls}
        className='section-heading'
      >
        About
      </motion.h2>
      <StyledAboutContent
        variants={parentVar}
        initial='hidden'
        animate={controls}
        ref={ref}
      >
        <motion.div className='image-wrapper' variants={fadeUp}>
          <Image
            className='about-image'
            src={zoms}
            alt='Zomer Gregorio Photo'
            width={300}
            height={422}
            placeholder='blur'
          />
          <div className='grayscale' />
        </motion.div>
        <motion.div variants={fadeLeft} className='about-text'>
          <h3>Zomer Gregorio</h3>
          <h4>Philomath</h4>
          <p>
            Hello! I am a highly motivated, passionate, and self-taught web
            developer. I&rsquo;m also a college student and currently pursuing a
            bachelors degree in Information Technology (3rd Year) from STI
            College Alabang. My main focus these days are building responsive
            and beautiful looking web applications and learning modern
            technologies for the web. I mostly work on personal projects and
            sometimes on freelance projects.
          </p>
        </motion.div>
        <motion.div
          ref={ref}
          initial='initial'
          variants={fadeUpDelay}
          animate={controls}
          className='image-wrapper-square hidden-image'
        >
          <Image
            className='about-image'
            src={zomsSquare}
            width={300}
            height={300}
            alt='Zomer Gregorio Photo'
            placeholder='blur'
          />
          <div className='grayscale' />
        </motion.div>
      </StyledAboutContent>
      <TechStacks />
    </StyledAbout>
  );
};

export default About;

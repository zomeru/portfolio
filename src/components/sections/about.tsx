import React, { useEffect } from 'react';
import Image from 'next/image';
import { TechStacks } from '../index';
import zoms from '../../assets/images/zoms.jpg';
import zomsSquare from '../../assets/images/zoms-square.jpg';
import { StyledAbout, StyledAboutContent } from '../../styles/componentStyles';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const About = () => {
  const { ref, inView } = useInView({
    // threshold: 1,
    triggerOnce: true,
    root: null,
    rootMargin: '-300px 0px',
  });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
    if (!inView) {
      controls.start('hidden');
    }
  }, [inView, controls]);

  const parentVar = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.4,
        when: 'beforeChildren',
      },
    },
  };

  const fadeUp = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const aboutInfoVar = {
    hidden: {
      x: 20,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.4,
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const imageVar = {
    hidden: {
      y: 20,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay: 1,
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

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
      <StyledAboutContent variants={parentVar} ref={ref}>
        <motion.div
          className='image-wrapper'
          variants={fadeUp}
          animate={controls}
        >
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
        <motion.div
          variants={aboutInfoVar}
          ref={ref}
          animate={controls}
          className='about-text'
        >
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
          variants={imageVar}
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

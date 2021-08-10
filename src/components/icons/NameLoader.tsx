// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'styled-components';

const svgVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
    },
  },
};

const pathVariants = {
  initial: {
    opacity: 0,
    pathLength: 0,
  },
  animate: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 2.5,
      ease: 'easeInOut',
    },
  },
};

const NameLoader = () => {
  const theme = useTheme();

  return (
    <motion.svg
      className='Loader'
      width='463'
      height='104'
      viewBox='0 0 463 104'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      variants={svgVariants}
      initial='initial'
      animate='animate'
      exit='exit'
    >
      <motion.path
        d='M16.176 90.624H65.136V102H0.624023V91.632L49.296 13.008H1.20002V1.63198H64.848V12L16.176 90.624Z'
        stroke={theme.accentMain}
        strokeWidth='3'
        variants={pathVariants}
      />
      <motion.path
        d='M128.498 103.008C119.186 103.008 110.69 100.848 103.01 96.528C95.3303 92.112 89.2343 86.016 84.7223 78.24C80.3063 70.368 78.0983 61.536 78.0983 51.744C78.0983 41.952 80.3063 33.168 84.7223 25.392C89.2343 17.52 95.3303 11.424 103.01 7.10398C110.69 2.68798 119.186 0.47998 128.498 0.47998C137.906 0.47998 146.45 2.68798 154.13 7.10398C161.81 11.424 167.858 17.472 172.274 25.248C176.69 33.024 178.898 41.856 178.898 51.744C178.898 61.632 176.69 70.464 172.274 78.24C167.858 86.016 161.81 92.112 154.13 96.528C146.45 100.848 137.906 103.008 128.498 103.008ZM128.498 91.632C135.506 91.632 141.794 90 147.362 86.736C153.026 83.472 157.442 78.816 160.61 72.768C163.874 66.72 165.506 59.712 165.506 51.744C165.506 43.68 163.874 36.672 160.61 30.72C157.442 24.672 153.074 20.016 147.506 16.752C141.938 13.488 135.602 11.856 128.498 11.856C121.394 11.856 115.058 13.488 109.49 16.752C103.922 20.016 99.5063 24.672 96.2423 30.72C93.0743 36.672 91.4903 43.68 91.4903 51.744C91.4903 59.712 93.0743 66.72 96.2423 72.768C99.5063 78.816 103.922 83.472 109.49 86.736C115.154 90 121.49 91.632 128.498 91.632Z'
        stroke={theme.accentMain}
        strokeWidth='3'
        variants={pathVariants}
      />
      <motion.path
        d='M298.005 2.35198V102H284.901V27.696L251.781 102H242.565L209.301 27.552V102H196.197V2.35198H210.309L247.173 84.72L284.037 2.35198H298.005Z'
        stroke={theme.accentMain}
        strokeWidth='3'
        variants={pathVariants}
      />
      <motion.path
        d='M333.333 12.288V45.84H369.909V56.64H333.333V91.2H374.229V102H320.229V1.48798H374.229V12.288H333.333Z'
        stroke={theme.accentMain}
        strokeWidth='3'
        variants={pathVariants}
      />
      <motion.path
        d='M446.905 102L423.001 60.96H407.161V102H394.057V1.63198H426.457C434.041 1.63198 440.425 2.92798 445.609 5.51998C450.889 8.11198 454.825 11.616 457.417 16.032C460.009 20.448 461.305 25.488 461.305 31.152C461.305 38.064 459.289 44.16 455.257 49.44C451.321 54.72 445.369 58.224 437.401 59.952L462.601 102H446.905ZM407.161 50.448H426.457C433.561 50.448 438.889 48.72 442.441 45.264C445.993 41.712 447.769 37.008 447.769 31.152C447.769 25.2 445.993 20.592 442.441 17.328C438.985 14.064 433.657 12.432 426.457 12.432H407.161V50.448Z'
        stroke={theme.accentMain}
        strokeWidth='3'
        variants={pathVariants}
      />
    </motion.svg>
  );
};

export default NameLoader;

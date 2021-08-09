import React, { useEffect } from 'react';
import { skills } from '../configs/data';
import { StyledTechStacks, StyledTech } from '../styles/componentStyles';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const TechStacks = () => {
  const { ref, inView } = useInView({
    // threshold: 1,
    triggerOnce: true,
    root: null,
    rootMargin: '-100px 0px',
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
        staggerChildren: 0.2,
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

  return (
    <StyledTechStacks
      ref={ref}
      variants={parentVar}
      initial='initial'
      animate={controls}
    >
      <motion.h1 variants={fadeUp}>SKILLS</motion.h1>
      <motion.p variants={fadeUp}>
        Here are some technologies I use for building awesome web applications.
      </motion.p>
      <StyledTech variants={fadeUp}>
        <motion.ul
          ref={ref}
          variants={parentVar}
          initial='initial'
          animate={controls}
        >
          {skills.map(skill => {
            const { name, Icon, id } = skill;

            return (
              <motion.li key={id} variants={fadeUp}>
                <div className='tech-content'>
                  <Icon className={`logo ${id}`} />
                  <p>{name}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </StyledTech>
    </StyledTechStacks>
  );
};

export default TechStacks;

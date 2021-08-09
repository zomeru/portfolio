import React, { useEffect } from 'react';
import { skills } from '../configs/data';
import { StyledTechStacks, StyledTech } from '../styles/componentStyles';
import { motion } from 'framer-motion';
import useScrollReveal from '../hooks/useScrollReveal';
import { parentVar, fadeUp } from '../configs/animations';

const TechStacks = () => {
  const [ref, controls] = useScrollReveal(-100);

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

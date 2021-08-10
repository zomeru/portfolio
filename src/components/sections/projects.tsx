import React from 'react';
import { FiGithub } from 'react-icons/fi';
import { BiLinkExternal } from 'react-icons/bi';
import { projects } from '../../configs/data';
import {
  StyledProjects,
  StyledProjectCardContainer,
  StyledProjectCardImage,
} from '../../styles/componentStyles';
import Image from 'next/image';
import useScrollReveal from '../../hooks/useScrollReveal';
import { parentVar, fadeUp } from '../../configs/animations';
import { motion } from 'framer-motion';

const Projects = () => {
  const [ref, controls] = useScrollReveal(-250);

  return (
    <StyledProjects>
      <motion.h2
        variants={fadeUp}
        initial='hidden'
        animate={controls}
        ref={ref}
        className='section-heading'
      >
        Projects
      </motion.h2>
      <StyledProjectCardContainer
        variants={parentVar}
        initial='hidden'
        animate={controls}
        ref={ref}
      >
        {projects.map(project => {
          const { name, image, info, techs, links, alt } = project;

          return (
            <motion.li
              variants={fadeUp}
              ref={ref}
              key={name}
              className='project-card'
            >
              <div className='project-details'>
                <h3 className='project-title'>{name}</h3>
                <p className='project-info'>{info}</p>
                <p className='project-techs'>
                  {techs.map(tech => (
                    <span className='tech' key={tech}>
                      {tech}
                    </span>
                  ))}
                </p>
                <div className='project-buttons'>
                  <a
                    aria-label={`Github repository of ${name}`}
                    href={links.github}
                  >
                    <FiGithub className='project-button' />
                  </a>
                  <a aria-label={`Live demo of ${name}`} href={links.demo}>
                    <BiLinkExternal className='project-button' />
                  </a>
                </div>
              </div>
              <StyledProjectCardImage>
                <Image
                  src={image}
                  alt={alt}
                  layout='fill'
                  objectFit='cover'
                  objectPosition='center'
                />
                <div className='overlay'></div>
              </StyledProjectCardImage>
            </motion.li>
          );
        })}
      </StyledProjectCardContainer>
    </StyledProjects>
  );
};

export default Projects;

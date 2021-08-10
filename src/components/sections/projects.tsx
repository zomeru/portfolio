// @ts-nocheck
import React from 'react';
import { FiGithub } from 'react-icons/fi';
import { BiLinkExternal } from 'react-icons/bi';
import { projects } from '../../configs/data';
import {
  StyledProjects,
  StyledProjectCardContainer,
  StyledProjectCardImage,
} from '../../styles/componentStyles';

const Projects = () => {
  return (
    <StyledProjects id='projects'>
      <h2 className='section-heading'>Projects</h2>
      <StyledProjectCardContainer>
        {projects.map(project => {
          const { name, image, info, techs, links } = project;

          return (
            <li key={name} className='project-card'>
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
                  <a href={links.github}>
                    <FiGithub className='project-button' />
                  </a>
                  <a href={links.demo}>
                    <BiLinkExternal className='project-button' />
                  </a>
                </div>
              </div>

              <StyledProjectCardImage image={image}>
                <div className='overlay'></div>
              </StyledProjectCardImage>
            </li>
          );
        })}
      </StyledProjectCardContainer>
    </StyledProjects>
  );
};

export default Projects;

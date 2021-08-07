import React from 'react';
import Image from 'next/image';
import { FiGithub } from 'react-icons/fi';
import { BiLinkExternal } from 'react-icons/bi';
import { projects } from '../../configs/data';
import {
  StyledProjects,
  StyledProjectGrid,
} from '../../styles/componentStyles';

const Projects = () => {
  return (
    <StyledProjects id='projects'>
      <h2 className='section-heading'>Projects</h2>
      {projects.map(project => {
        const { name, images, info, techs, links } = project;
        const { demo, github } = links;
        const { img1, alt1 } = images;

        return (
          <StyledProjectGrid key={name}>
            <li>
              <a
                href={demo}
                target='_blank'
                rel='noopener noreferrer'
                className='project-image'
                aria-label={name}
              >
                <Image src={img1} alt={alt1} placeholder='blur' />
              </a>
              <div className='opaque-bg' />
              <div className='project-details'>
                <h3 className='project-name'>{name}</h3>
                <p className='project-info'>{info}</p>
                <p className='project-tech'>
                  {techs.map(tech => (
                    <span key={tech}>{tech}</span>
                  ))}
                </p>
                <div className='project-buttons'>
                  <a
                    href={demo}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label={name}
                  >
                    <BiLinkExternal className='buttons' />
                  </a>
                  <a
                    href={github}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label='Github repository'
                  >
                    <FiGithub className='buttons' />
                  </a>
                </div>
              </div>
            </li>
          </StyledProjectGrid>
        );
      })}
    </StyledProjects>
  );
};

export default Projects;

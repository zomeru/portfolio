import React from 'react';
import Image from 'next/image';
import { FiGithub } from 'react-icons/fi';
import { BiLinkExternal } from 'react-icons/bi';
import { projects } from '../../data';
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
        const { img1, img2, alt1, alt2 } = images;

        return (
          <StyledProjectGrid key={name}>
            <li>
              <a href={demo} className='project-image'>
                <div className='image-1'>
                  <Image src={img1} alt={alt1} placeholder='blur' />
                </div>

                <div className='image-2'>
                  <Image src={img2} alt={alt2} placeholder='blur' />
                </div>
              </a>
              <div className='project-details'>
                <h3 className='project-name'>{name}</h3>
                <p className='project-info'>{info}</p>
                <p className='project-tech'>
                  {techs.map(tech => (
                    <span key={tech}>{tech}</span>
                  ))}
                </p>
                <div className='project-buttons'>
                  <a href={demo} target='_blank' rel='noreferrer'>
                    <BiLinkExternal className='buttons' />
                  </a>
                  <a href={github} target='_blank' rel='noreferrer'>
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

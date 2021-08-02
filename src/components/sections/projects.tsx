import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { FiGithub } from 'react-icons/fi';
import { BiLinkExternal } from 'react-icons/bi';
import { projects } from '../../config';

const StyledProjects = styled.section`
  height: auto;
  padding: 50px;
`;

const StyledProjectGrid = styled.ul`
  width: 100%;

  :not(:last-child) {
    margin-bottom: 35px;
  }

  li {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(6, 50px);
    grid-gap: 12px;
    position: relative;
  }

  img {
    width: 100%;
  }

  .project-image {
    padding: 25px 25px 0 25px;
    width: 100%;
    background-color: rgba(144, 202, 249, 0.25);
    border: 3px solid rgba(144, 202, 249, 0.35);
    border-radius: 5px;
    overflow: hidden;
    grid-column: 1/8;
    grid-row: 1/7;

    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(7, 50px);
  }

  .image-1 {
    width: 100%;
    grid-column: 1/11;
    grid-row: 1 / 6;
  }

  .image-2 {
    width: 100%;
    grid-column: 4 / 13;
    grid-row: 4 / 8;
  }

  .project-details {
    margin-left: 20px;
    width: 100%;
    grid-column: 8 / 13;
    grid-row: 1 / 7;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .project-name {
    font-size: 30px;
    margin-bottom: 20px;
  }

  .project-info {
    color: var(--gray-light);
    margin-bottom: 20px;
  }

  .project-tech {
    color: var(--gray-light);
    margin-bottom: 40px;

    span {
      :not(:last-child) {
        margin-right: 15px;
      }
    }
  }

  .project-buttons {
    display: flex;
    align-items: center;

    a :not(:last-child) {
      margin-right: 15px;
    }

    .buttons {
      width: 30px;
      height: 30px;
    }
  }
`;

interface IprojectsProps {}

const Projects: React.FC<IprojectsProps> = ({}) => {
  return (
    <StyledProjects id='projects'>
      <h2 className='section-heading'>Projects</h2>
      {projects.map(project => {
        const { name, images, info, techs, links } = project;
        const { demo, github } = links;

        return (
          <StyledProjectGrid key={name}>
            <li>
              <a href='#' className='project-image'>
                <div className='image-1'>
                  <Image src={images.img1} alt='Zomer' />
                </div>

                <div className='image-2'>
                  <Image src={images.img2} alt='ZOmer' />
                </div>
              </a>
              <div className='project-details'>
                <h3 className='project-name'>{name}</h3>
                <p className='project-info'>{info}</p>
                <p className='project-tech'>
                  {techs.map(tech => (
                    <span key={tech}>{tech}</span>
                  ))}
                  {/* <span>Javascript</span>
                  <span>React.js</span>
                  <span>Next.js</span> */}
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

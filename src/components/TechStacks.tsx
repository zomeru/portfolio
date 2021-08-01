import React from 'react';
import styled from 'styled-components';
import { AiFillGithub, AiFillHtml5 } from 'react-icons/ai';
import { IoLogoSass } from 'react-icons/io';
import {
  SiTypescript,
  SiTailwindcss,
  SiFirebase,
  SiJavascript,
} from 'react-icons/si';
import { FaReact, FaNodeJs, FaGitAlt } from 'react-icons/fa';
import { skills } from '../config';

const StyledTechStacks = styled.div`
  margin: 70px auto 0 auto;
  text-align: center;

  h1 {
    font-size: 30px;
    margin-bottom: var(--mg-sm);
  }

  > p {
    color: var(--gray-light);
  }
`;

const StyledTech = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--mg-lg);

  ul {
    max-width: 75%;
    display: flex;
    flex-flow: wrap;
    justify-content: center;
  }

  li {
    border: 1px solid var(--gray-light);
    height: 55px;
    width: auto;
    border-radius: 5px;
    overflow: hidden;
    display: inline-block;
    margin: 0 10px 15px 10px;

    .tech-content {
      display: flex;
      align-items: center;
      height: 100%;

      .logo {
        margin-left: 10px;
        margin-right: 20px;
        width: 30px;
        height: 30px;
      }

      p {
        margin-right: 10px;
        color: var(--gray-light);
      }
    }
  }
`;

const TechStacks = () => {
  const html5 = <AiFillHtml5 className='logo' />;
  const sass = <IoLogoSass className='logo' />;
  const js = <SiJavascript className='logo' />;
  const ts = <SiTypescript className='logo' />;
  const react = <FaReact className='logo' />;
  const tailwind = <SiTailwindcss className='logo' />;
  const node = <FaNodeJs className='logo' />;
  const firebase = <SiFirebase className='logo' />;
  const github = <AiFillGithub className='logo' />;
  const git = <FaGitAlt className='logo' />;

  const iconList = [
    html5,
    sass,
    js,
    ts,
    react,
    tailwind,
    node,
    firebase,
    github,
    git,
  ];

  return (
    <StyledTechStacks>
      <h1>SKILLS</h1>
      <p>
        Here are some technologies I use for building awesome web applications.
      </p>
      <StyledTech>
        <ul>
          {skills.map((skill, index) => {
            return (
              <li key={skill.name}>
                <div className='tech-content'>
                  <div style={{ color: skill.color }}>{iconList[index]}</div>
                  <p>{skill.name}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </StyledTech>
    </StyledTechStacks>
  );
};

export default TechStacks;

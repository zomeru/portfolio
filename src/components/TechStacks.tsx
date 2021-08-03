import React from 'react';
import { skills } from '../data';
import { StyledTechStacks, StyledTech } from '../styles/componentStyles';

const TechStacks = () => {
  return (
    <StyledTechStacks>
      <h1>SKILLS</h1>
      <p>
        Here are some technologies I use for building awesome web applications.
      </p>
      <StyledTech>
        <ul>
          {skills.map(skill => {
            const { name, color, Icon } = skill;

            return (
              <li key={name}>
                <div className='tech-content'>
                  <Icon className='logo' style={{ color: color }} />
                  <p>{name}</p>
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

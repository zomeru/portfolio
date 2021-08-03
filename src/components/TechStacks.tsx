import React from 'react';
import styled from 'styled-components';
import { skills } from '../data';

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
    border-radius: 3px;
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

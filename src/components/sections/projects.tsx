import React from 'react';
import styled from 'styled-components';

const StyledProjects = styled.section`
  height: 100vh;
  padding: 50px;
`;

interface IprojectsProps {}

const Projects: React.FC<IprojectsProps> = ({}) => {
  return (
    <StyledProjects id='projects'>
      <h2 className='section-heading'>Projects</h2>
      <h3>(Still in development)</h3>
    </StyledProjects>
  );
};

export default Projects;

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
      <h2 className='section-heading'>PROJects</h2>
    </StyledProjects>
  );
};

export default Projects;

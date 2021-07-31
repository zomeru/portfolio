import React from 'react';
import styled from 'styled-components';

const StyledTechStacks = styled.div`
  margin: 0 auto;
  text-align: center;
`;

interface ITechStacksProps {}

const TechStacks: React.FC<ITechStacksProps> = ({}) => {
  return (
    <StyledTechStacks>
      <h1>TECH STACKS</h1>
    </StyledTechStacks>
  );
};

export default TechStacks;

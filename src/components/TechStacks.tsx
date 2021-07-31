import React from 'react';
import styled from 'styled-components';

const StyledTechStacks = styled.div`
  height: 100vh;
  margin: 70px auto 0 auto;
  text-align: center;

  h1 {
    font-size: 30px;
    margin-bottom: var(--mg-sm);
  }
`;

interface ITechStacksProps {}

const TechStacks: React.FC<ITechStacksProps> = ({}) => {
  return (
    <StyledTechStacks>
      <h1>TECH STACKS</h1>
      <p>Here are some technologies I&rsquo;ve been working with recently.</p>
      <div></div>
    </StyledTechStacks>
  );
};

export default TechStacks;

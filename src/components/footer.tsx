import React from 'react';
import styled from 'styled-components';

const StyledFooter = styled.footer`
  text-align: center;
  width: 50%;
  margin: 0 auto;
`;

interface IfooterProps {}

const Footer: React.FC<IfooterProps> = ({}) => {
  return (
    <StyledFooter>
      <h1>FOOTER</h1>
    </StyledFooter>
  );
};

export default Footer;

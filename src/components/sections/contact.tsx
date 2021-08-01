import React from 'react';
import styled from 'styled-components';

const StyledContact = styled.section`
  height: 100vh;
  padding: 50px 40%;
  text-align: center;
`;

interface IcontactProps {}

const Contact: React.FC<IcontactProps> = ({}) => {
  return (
    <StyledContact id='contact'>
      <h1 className='section-heading'>Contact</h1>
      <h3>(Still in development)</h3>
    </StyledContact>
  );
};

export default Contact;

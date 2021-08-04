import React from 'react';
import styled from 'styled-components';
import { Nav, Footer, Button } from '../src/components';

const StyledNotFound = styled.section`
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  margin-bottom: 0px;
  justify-content: space-between;

  .notFoundContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: -20px;

    h1 {
      font-size: clamp(70px, 22vw, 150px);
      margin-bottom: -20px;
    }

    h2 {
      font-size: clamp(25px, 5vw, 40px);
      font-weight: var(--font-regular);
      margin-bottom: 30px;
    }
  }
`;

interface INotFoundProps {}

const NotFound: React.FC<INotFoundProps> = ({}) => {
  return (
    <StyledNotFound>
      <Nav />
      <div className='notFoundContent'>
        <h1 className='section-heading'>404</h1>
        <h2>Page Not Found</h2>
        <Button
          isLink={true}
          buttonUrl='/'
          buttonText='Go home'
          className='notFoundButton'
        />
      </div>
      <Footer />
    </StyledNotFound>
  );
};

export default NotFound;

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Nav, Footer, Button } from '../src/components';
import { useRouter } from 'next/router';

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
    margin-top: -50px;

    h1 {
      font-size: clamp(70px, 22vw, 150px);
      margin-bottom: -20px;
    }

    h2 {
      font-size: clamp(25px, 5vw, 40px);
      font-weight: var(--font-regular);
      margin-bottom: 20px;
    }

    .redirect-message {
      margin-bottom: 30px;
    }
  }
`;

interface INotFoundProps {
  theme: string;
  toggleTheme: () => void;
  isHome: boolean;
}

const NotFound: React.FC<INotFoundProps> = ({ theme, toggleTheme, isHome }) => {
  const time = 1000;
  const router = useRouter();
  const [redirectDelay, setRedirectDelay] = useState(10);
  useEffect(() => {
    setTimeout(() => {
      if (redirectDelay > 0) {
        setRedirectDelay(redirectDelay - 1);
      }
    }, time * 1);
    setTimeout(() => {
      router.push('/');
    }, time * 11);
  }, [redirectDelay, router]);
  return (
    <StyledNotFound>
      <Nav isHome={isHome} theme={theme} toggleTheme={toggleTheme} />
      <div className='notFoundContent'>
        <h1 className='section-heading'>404</h1>
        <h2>Page Not Found</h2>
        <p className='redirect-message'>
          You will be redirected to home page in {redirectDelay}s.
        </p>
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

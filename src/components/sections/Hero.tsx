import React from 'react';
import { Nav, Button } from '../index';
import styled from 'styled-components';

const StyledHero = styled.section`
  width: 100%;
  max-height: 100vh;
  max-width: 1600px;
  margin: 0 auto;
`;

const StyledHeroContent = styled.div`
  padding: 0 120px;
  height: calc(100vh - 100px);
  margin: 0 auto;
  margin-top: -30px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  h1 {
    font-weight: var(--font-regular);
    margin-bottom: var(--mg-md);
  }

  h2 {
    margin-left: -10px;
    font-weight: var(--font-regular);
    font-size: 90px;
    margin-bottom: var(--mg-md);
  }

  h3 {
    margin-left: var(--mg-xl);
    font-weight: var(--font-regular);
    font-size: 70px;
    margin-bottom: var(--mg-md);
  }

  > p {
    font-weight: var(--font-medium);
    margin-left: var(--mg-xxl);
  }

  .hero-button {
    margin-left: var(--mg-xxl);
    margin-top: var(--mg-xl);
  }
`;

interface IHeroProps {}

const one = <h1>Hi, I&rsquo;m Zomer Gregorio</h1>;
const two = <h2> Fullstack Developer</h2>;
const three = <h3>I create stuff sometimes</h3>;
const four = (
  <p>A college student and a Full Stack Developer based in the Philippines.</p>
);

const Hero: React.FC<IHeroProps> = ({}) => {
  return (
    <StyledHero>
      <Nav />
      <StyledHeroContent>
        {one}
        {two}
        {three}
        {four}
        <div className='hero-button'>
          <Button buttonUrl='#contact' buttonText='Say Hello' />
        </div>
      </StyledHeroContent>
    </StyledHero>
  );
};

export default Hero;

import React from 'react';
import { Button } from '../index';
import { floatingLinks } from '../../data';
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from '../../styles/componentStyles';

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <h2 data-letters='Zomer Gregorio.'>Zomer Gregorio.</h2>;
  const three = <h3>A self-taught web developer.</h3>;
  const four = (
    <p className='four'>
      A college student and Software Engineer based in the Philippines. React.js
      enthusiast and loves building beautiful, elegant and responsive web
      applications.
    </p>
  );

  const heroTexts = [one, two, three, four];

  return (
    <StyledHero>
      <StyledHeroContainer>
        <StyledHeroContent>
          {heroTexts.map((text, index) => (
            <React.Fragment key={index}>{text}</React.Fragment>
          ))}
          <Button
            className='hero-button'
            buttonUrl='#contact'
            buttonText='Get in touch'
          />
          {floatingLinks.map(link => {
            const { name, url, Icon } = link;

            return (
              <a
                key={name}
                aria-label={name}
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                className={`floating-icons ${name}-loc`}
              >
                <Icon className={`icons icon-${name}`} />
              </a>
            );
          })}
        </StyledHeroContent>
      </StyledHeroContainer>
    </StyledHero>
  );
};

export default Hero;

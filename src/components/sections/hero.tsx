import React from 'react';
import { Button } from '../index';
import { floatingLinks } from '../../configs/data';
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from '../../styles/componentStyles';
import { motion } from 'framer-motion';
import { fadeUp } from '../../configs/animations';

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <h2 data-letters='Zomer Gregorio.'>Zomer Gregorio.</h2>;
  const three = <h3>A self-taught web developer.</h3>;
  const four = (
    <p className='four'>
      A college student and React.js enthusiast. I love building beautiful,
      elegant and responsive web applications.
    </p>
  );

  const heroTexts = [one, two, three, four];

  const heroContainerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.3,
        staggerChildren: 0.32,
        when: 'beforeChildren',
      },
    },
  };

  return (
    <StyledHero>
      <StyledHeroContainer>
        <StyledHeroContent
          variants={heroContainerVariants}
          initial='hidden'
          animate='visible'
        >
          {heroTexts.map((text, i) => (
            <motion.div variants={fadeUp} key={i}>
              {text}
            </motion.div>
          ))}
          <motion.div variants={fadeUp}>
            <Button
              isLink={false}
              className='hero-button'
              buttonUrl='#contact'
              buttonText='Get in touch'
            />
          </motion.div>
          {floatingLinks.map(link => {
            const { name, url, Icon } = link;

            return (
              <motion.a
                variants={fadeUp}
                key={name}
                aria-label={name}
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                className={`floating-icons ${name}-loc`}
              >
                <Icon className={`icons icon-${name}`} />
              </motion.a>
            );
          })}
        </StyledHeroContent>
      </StyledHeroContainer>
    </StyledHero>
  );
};

export default Hero;

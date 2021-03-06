import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../../configs/animations';
import { floatingLinks } from '../../configs/data';
import { Button } from '../index';
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from '../../styles/componentStyles';

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <h2>Zomer Gregorio.</h2>;
  const three = <h3>I create stuff sometimes.</h3>;
  const four = (
    <p className='four'>
      I&lsquo;m a Software Engineer based in the Philippines. I have profound
      interest in full-stack web and mobile development, and I&lsquo;m always
      looking to learn new things.
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
        delay: 1,
        staggerChildren: 0.2,
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
          <motion.div className='buttons-container' variants={fadeUp}>
            <Button
              isLink={false}
              className='hero-buttons'
              buttonUrl='#contact'
              buttonText='Get in touch'
            />
            <Button
              isLink={false}
              className='hero-buttons'
              buttonUrl='/assets/resume.pdf'
              buttonText='Resume'
              download
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

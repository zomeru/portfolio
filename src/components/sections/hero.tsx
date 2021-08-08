import React from 'react';
import { Button } from '../index';
import { floatingLinks } from '../../configs/data';
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from '../../styles/componentStyles';
import { motion } from 'framer-motion';

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <h2 data-letters='Zomer Gregorio.'>Zomer Gregorio.</h2>;
  const three = <h3>A self-taught web developer.</h3>;
  const four = (
    <p className='four'>
      A college student and self-taught web developer from the Philippines.
      React.js enthusiast and loves building beautiful, elegant and responsive
      web applications.
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
        delay: 0.65,
        staggerChildren: 0.2,
        when: 'beforeChildren',
      },
    },
  };

  const heroItemsVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.2,
        when: 'beforeChildren',
        ease: 'easeInOut',
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
            <motion.div
              variants={heroItemsVariants}
              // initial={{ opacity: 0, y: 30 }}
              // animate={{
              //   opacity: 1,
              //   y: 0,
              //   transition: {
              //     delay: 0.9 + i * 0.1,
              //     ease: 'easeInOut',
              //   },
              // }}
              key={i}
            >
              {text}
            </motion.div>
          ))}
          <motion.div
            variants={heroItemsVariants}
            // variants={heroButtonVariants}
            // initial='initial'
            // animate='animate'
          >
            <Button
              isLink={false}
              className='hero-button'
              buttonUrl='#contact'
              buttonText='Get in touch'
            />
          </motion.div>
          {floatingLinks.map((link, i) => {
            const { name, url, Icon } = link;

            return (
              <motion.a
                variants={heroItemsVariants}
                // initial={{ opacity: 0 }}
                // animate={{
                //   opacity: 1,
                //   transition: {
                //     delay: 1.4 + 1 * 0.2,
                //     ease: 'easeInOut',
                //   },
                // }}
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

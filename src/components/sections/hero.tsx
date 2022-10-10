import React from "react";
import { motion } from "framer-motion";
import { fadeUp } from "../../configs/animations";
import { floatingLinks } from "../../configs/data";
import { Button } from "../index";
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from "../../styles/componentStyles";

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <h2>Zomer Gregorio.</h2>;
  const three = <h3>I create stuff for the web.</h3>;
  const four = (
    <p className="four">
      Experienced Software Engineer based in the Philippines with a demonstrated
      history of working in the information technology and services industry.
      Skilled in React, Node, and Typescript and have more than 2 years of
      professional experience in Full Stack Development.
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
        when: "beforeChildren",
      },
    },
  };

  return (
    <StyledHero>
      <StyledHeroContainer>
        <StyledHeroContent
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {heroTexts.map((text, i) => (
            <motion.div variants={fadeUp} key={i}>
              {text}
            </motion.div>
          ))}
          <motion.div className="buttons-container" variants={fadeUp}>
            <Button
              isLink={false}
              className="hero-buttons"
              buttonUrl="#contact"
              buttonText="Get in touch"
            />
            <Button
              isLink={false}
              className="hero-buttons"
              buttonUrl="/assets/resume.pdf"
              buttonText="Resume"
              rel="noopener noreferrer"
              target="_blank"
              // download
            />
          </motion.div>
          {floatingLinks.map((link) => {
            const { name, url, Icon } = link;

            return (
              <motion.a
                variants={fadeUp}
                key={name}
                aria-label={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
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

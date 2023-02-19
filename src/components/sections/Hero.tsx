import React from "react";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { fadeUp } from "../../configs/animations";
import { floatingLinks } from "../../configs/data";
import { Button } from "../index";
import {
  StyledHero,
  StyledHeroContainer,
  StyledHeroContent,
} from "../../styles/componentStyles";

const gradient = keyframes`
0% {
  background-position: 0 50%;
}
50% {
  background-position: 100% 50%;
}
100% {
  background-position: 0 50%;
}
`;

const StyledName = styled.h2`
  margin-left: -8px;
  font-weight: 700;
  font-size: clamp(28px, 7vw, 85px);
  margin-bottom: 10px;
  position: relative;
  max-width: 720px;
  animation: ${gradient} 5s ease-in-out infinite;
  background: ${({ theme }) =>
    `linear-gradient(to right, #8b174b, #570f66, #341671, ${theme.accentMain})`};
  background-size: 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Hero = () => {
  const one = <h1>Hi there, I am</h1>;
  const two = <StyledName>Zomer Gregorio.</StyledName>;
  const three = <h3>I create stuff for the web.</h3>;
  const four = (
    <p className="four">
      A Software Engineer based in the Philippines with a demonstrated history
      of working in the information technology and services industry. Skilled in
      React, Node, Typescript, and other web technologies with 2 years of
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

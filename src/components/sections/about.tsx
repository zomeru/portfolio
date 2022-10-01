import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import useScrollReveal from "../../hooks/useScrollReveal";
import {
  parentVar,
  fadeUp,
  fadeLeft,
  fadeUpDelay,
} from "../../configs/animations";
import TechStacks from "../TechStacks";
import { StyledAbout, StyledAboutContent } from "../../styles/componentStyles";

const About = () => {
  const [ref, controls] = useScrollReveal(-250);

  return (
    <StyledAbout
      variants={parentVar}
      initial="hidden"
      animate="visible"
      id="about"
    >
      <motion.h2
        ref={ref}
        variants={fadeUp}
        animate={controls}
        className="section-heading"
      >
        About
      </motion.h2>
      <StyledAboutContent
        variants={parentVar}
        initial="hidden"
        animate={controls}
        ref={ref}
      >
        <motion.div className="image-wrapper" variants={fadeUp}>
          <Image
            className="about-image"
            // src={zoms}
            src="/assets/me.jpg"
            alt="Zomer Gregorio Photo"
            width={300}
            height={422}
            placeholder="blur"
            blurDataURL="/assets/me.jpg"
          />
          <div className="grayscale" />
        </motion.div>
        <motion.div variants={fadeLeft} className="about-text">
          <h3>Zomer Gregorio</h3>
          <p>
            I&lsquo;m a full-time software engineer at Beyonder Inc. and a 4th
            year college student, studying Information Technology at STI
            College. My main focus these days are building responsive and
            elegant web and mobile applications. I also like to learn new stuff
            and play video games in my free time.
          </p>
        </motion.div>
        <motion.div
          ref={ref}
          initial="initial"
          variants={fadeUpDelay}
          animate={controls}
          className="image-wrapper-square hidden-image"
        >
          <Image
            className="about-image"
            src="/assets/me-square.jpg"
            width={300}
            height={300}
            alt="Zomer Gregorio Photo"
            placeholder="blur"
            blurDataURL="/assets/me-square.jpg"
          />
          <div className="grayscale" />
        </motion.div>
      </StyledAboutContent>
      <TechStacks />
    </StyledAbout>
  );
};

export default About;

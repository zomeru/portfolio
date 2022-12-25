import React from "react";
import { motion } from "framer-motion";
import useScrollReveal from "../../hooks/useScrollReveal";
import { parentVar, fadeUp } from "../../configs/animations";
import { Button } from "../";
import { StyledContact } from "../../styles/componentStyles";

const Contact = () => {
  const [ref, controls] = useScrollReveal(-250);

  return (
    <StyledContact
      variants={parentVar}
      initial="initial"
      animate={controls}
      ref={ref}
      id="contact"
    >
      <motion.h2 variants={fadeUp} className="section-heading">
        {/* I occasionally take on freelance opportunities */}
        Get in touch
      </motion.h2>
      <motion.p variants={fadeUp} className="contact-p">
        My inbox is always open. Whether you have a project where you need some
        help or just want to tell me something, send me over a message and
        let&rsquo;s chat.
        {/* Although I&rsquo;m not currently looking for any new opportunities, my
        inbox is always open. Whether you have a question or just want to say
        hi, I&rsquo;ll try my best to get back to you! */}
      </motion.p>
      <motion.div variants={fadeUp}>
        <Button
          isLink={false}
          className="message-button"
          buttonText="Say hello"
          buttonUrl="mailto:hello@zomeru.com"
          target="_blank"
          rel="noreferrer"
        />
      </motion.div>
    </StyledContact>
  );
};

export default Contact;

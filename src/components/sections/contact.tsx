import React from 'react';
import { motion } from 'framer-motion';
import useScrollReveal from '../../hooks/useScrollReveal';
import { parentVar, fadeUp } from '../../configs/animations';
import { Button } from '../';
import { StyledContact } from '../../styles/componentStyles';

const Contact = () => {
  const [ref, controls] = useScrollReveal(-250);

  return (
    <StyledContact
      variants={parentVar}
      initial='initial'
      animate={controls}
      ref={ref}
      id='contact'
    >
      <motion.h2 variants={fadeUp} className='section-heading'>
        I occasionally take on freelance opportunities
      </motion.h2>
      <motion.p variants={fadeUp} className='contact-p'>
        My inbox is always open. Whether you have a project where you need some
        help or just want to tell me something, send me over a message and
        let&rsquo;s chat.
      </motion.p>
      <motion.div variants={fadeUp}>
        <Button
          isLink={false}
          className='message-button'
          buttonText='Say hello'
          buttonUrl='mailto:zomergregorio@gmail.com'
          target='_blank'
          rel='noreferrer'
        />
      </motion.div>
    </StyledContact>
  );
};

export default Contact;

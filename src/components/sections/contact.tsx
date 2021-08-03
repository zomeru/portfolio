import React from 'react';
import { Button } from '../';
import { StyledContact } from '../../styles/componentStyles';

const Contact = () => {
  return (
    <StyledContact id='contact'>
      <h2 className='section-heading'>
        I occasionally take on freelance opportunities
      </h2>
      <p className='contact-p'>
        My inbox is always open. Whether you have a project where you need some
        help or just want to tell me something, send me over a message and
        let&rsquo;s chat.
      </p>
      <Button
        className='message-button'
        buttonText='Say hello'
        buttonUrl='mailto:zomergregorio@gmail.com'
        target='_blank'
        rel='noreferrer'
      />
    </StyledContact>
  );
};

export default Contact;

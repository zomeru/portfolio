import React from 'react';
import styled from 'styled-components';
import { Button } from '../';

const StyledContact = styled.section`
  height: auto;
  padding: 50px 300px;
  text-align: center;
  /* margin: 0 auto; */
  margin-bottom: 200px;

  .contact-p {
    color: var(--gray-light);
  }

  .message-button {
    margin: 0 auto;
    margin-top: 50px;
  }
`;

interface IcontactProps {}

const Contact: React.FC<IcontactProps> = ({}) => {
  return (
    <StyledContact id='contact'>
      <h1 className='section-heading'>
        I occasionally take on freelance opportunities
      </h1>
      <p className='contact-p'>
        My inbox is always open. If you have a project where you need some help
        or just want to tell me something, send me over a message and
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

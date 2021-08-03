import React from 'react';
import styled from 'styled-components';
import { Button } from '../';

const StyledContact = styled.section`
  height: auto;
  padding: 50px 300px;
  text-align: center;
  /* margin: 0 auto; */
  margin-bottom: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media only screen and (max-width: 1400px) {
    padding: 50px 20%;
  }

  @media only screen and (max-width: 1080px) {
    padding: 50px 10%;
  }

  @media only screen and (max-width: 1000px) {
    padding: 50px 30px;
  }

  @media only screen and (max-width: 768px) {
    padding: 50px 0;
  }

  h2 {
    @media only screen and (max-width: 768px) {
      line-height: 0.8;
    }

    @media only screen and (max-width: 600px) {
      line-height: 0.6;
      margin-bottom: 40px;
    }

    @media only screen and (max-width: 600px) {
      font-size: 22px;
      line-height: 0.4;
    }
  }

  .contact-p {
    color: var(--gray-light);
    width: 85%;

    @media only screen and (max-width: 600px) {
      width: 100%;
    }
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

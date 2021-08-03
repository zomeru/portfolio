import React from 'react';
import styled from 'styled-components';
import { socialLinks } from '../data';

const StyledFooter = styled.footer`
  text-align: center;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 30px;

  a {
    font-size: var(--fz-sm);
    font-weight: var(--font-semibold);
  }
`;

const StyledSocialLinks = styled.div`
  height: 50px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;

  a {
    padding: 5px;
    transition: transform 0.2s ease-out;

    :not(:last-child) {
      margin-right: 25px;
    }

    :hover {
      transform: translateY(-7px);
    }
  }

  .icon {
    width: 22px;
    height: 22px;
  }
`;

interface IfooterProps {}

const Footer: React.FC<IfooterProps> = ({}) => {
  return (
    <StyledFooter>
      <StyledSocialLinks>
        {socialLinks.map((social: any) => {
          const { name, url, Icon } = social;

          return (
            <a href={url} key={name} target='_blank' rel='noreferrer'>
              <Icon className='icon' />
            </a>
          );
        })}
      </StyledSocialLinks>
      <a
        href='https://github.com/zomeru/portfolio'
        target='_blank'
        rel='noreferrer'
      >
        Designed and built by Zomer Gregorio
        <br />
        &copy; 2021 - All rights reserved
      </a>
    </StyledFooter>
  );
};

export default Footer;

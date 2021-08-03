import React from 'react';
import { socialLinks } from '../data';
import { StyledFooter, StyledSocialLinks } from '../styles/componentStyles';

const Footer = () => {
  return (
    <StyledFooter>
      <StyledSocialLinks>
        {socialLinks.map((social: any) => {
          const { name, url, Icon } = social;

          return (
            <a
              href={url}
              key={name}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={name}
            >
              <Icon className='icon' />
            </a>
          );
        })}
      </StyledSocialLinks>
      <a
        href='https://github.com/zomeru/portfolio'
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Github repository of this portfolio website.'
      >
        Designed and built by Zomer Gregorio
        <br />
        &copy; 2021 - All rights reserved
      </a>
    </StyledFooter>
  );
};

export default Footer;

import React from 'react';
import { socialLinks } from '../configs/data';
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
        &copy; 2021 Zomer Gregorio. All rights reserved.
      </a>
    </StyledFooter>
  );
};

export default Footer;

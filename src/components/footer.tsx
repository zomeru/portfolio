import React from 'react';
import styled from 'styled-components';
import { socialLinks } from '../config';

const StyledFooter = styled.footer`
  text-align: center;
  width: 50%;
  margin: 0 auto;
  padding-bottom: 20px;

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

  a {
    :not(:last-child) {
      margin-right: 20px;
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
      <a href=''>Designed and built by Zomer Gregorio</a>
    </StyledFooter>
  );
};

export default Footer;

import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.a`
  position: relative;
  min-width: 200px;
  min-height: 50px;
  max-width: 200px;
  max-height: 50px;
  text-decoration: none;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--color-black);
  text-transform: uppercase;
  font-weight: var(--font-medium);
  font-size: var(--fz-sm);

  :link,
  :visited {
    color: var(--color-black);
  }

  ::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-blue-dark-o);
    z-index: -1;
    transform: scaleX(0.1);
    transform-origin: left;
    transition: all 0.3s ease-in-out;
  }

  :hover::before {
    transform: scaleX(1);
  }

  :hover .line::before {
    opacity: 1;
    transform: scaleX(1);
    background-color: var(--color-white);
  }

  :hover p {
    margin-left: 20px;
    color: var(--color-white);
  }

  .line::before {
    content: '';
    position: absolute;
    background-color: var(--color-black);
    width: 25px;
    height: 1px;
    top: 50%;
    left: 0;
    bottom: 0;
    right: 0;
    transform: scaleX(0);
    transform-origin: left;
    opacity: 0;
    margin-left: 30px;
    transition: transform 0.3s ease-in-out;
  }

  p {
    position: relative;
    margin-left: -30px;
    z-index: 10;
    transition: all 0.3s ease-in-out;
    /* justify-self: center; */
  }
`;

interface IButton {
  buttonText: string;
  buttonUrl: string;
}

const Button: React.FC<IButton> = ({ buttonText, buttonUrl }) => {
  return (
    <StyledButton href={buttonUrl}>
      <div className='line'></div>
      <p>{buttonText}</p>
    </StyledButton>
  );
};

export default Button;

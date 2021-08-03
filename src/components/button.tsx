import React from 'react';
import { StyledButton } from '../styles/componentStyles';

interface IButton {
  buttonText: string;
  buttonUrl: string;
  className?: string;
  target?: string;
  rel?: string;
}

const Button: React.FC<IButton> = ({
  buttonText,
  buttonUrl,
  className,
  target,
  rel,
}) => {
  return (
    <StyledButton
      href={buttonUrl}
      target={target}
      rel={rel}
      className={className}
    >
      <div className='line'></div>
      <p>{buttonText}</p>
    </StyledButton>
  );
};

export default Button;

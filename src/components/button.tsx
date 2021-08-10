import React from 'react';
import Link from 'next/link';
import { StyledButton } from '../styles/componentStyles';

interface IButton {
  buttonText: string;
  buttonUrl: string;
  className?: string;
  target?: string;
  rel?: string;
  isLink: boolean;
}

const Button: React.FC<IButton> = ({
  buttonText,
  buttonUrl,
  className,
  target,
  rel,
  isLink,
}) => {
  return (
    <>
      {isLink ? (
        <Link href={buttonUrl} passHref>
          <StyledButton className={className}>
            <div className='line'></div>
            <p>{buttonText}</p>
          </StyledButton>
        </Link>
      ) : (
        <StyledButton
          href={buttonUrl}
          target={target}
          rel={rel}
          className={className}
        >
          <div className='line'></div>
          <p>{buttonText}</p>
        </StyledButton>
      )}
    </>
  );
};

export default Button;

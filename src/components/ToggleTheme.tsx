import React from 'react';
import { RiMoonClearLine } from 'react-icons/ri';
import { FiSun } from 'react-icons/fi';
import { StyledToggle } from '../styles/componentStyles';

interface IToggleThemeProps {
  theme: string;
  toggleTheme: () => void;
  className?: string;
}

const ToggleTheme: React.FC<IToggleThemeProps> = ({
  theme,
  toggleTheme,
  className,
}) => {
  return (
    <StyledToggle className={className} onClick={toggleTheme}>
      {theme === 'light' ? (
        <RiMoonClearLine className='icons' />
      ) : (
        <FiSun className='icons' />
      )}
    </StyledToggle>
  );
};

export default ToggleTheme;

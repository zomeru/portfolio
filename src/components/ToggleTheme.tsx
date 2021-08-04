import React from 'react';
import { RiMoonClearLine } from 'react-icons/ri';
import { FiSun } from 'react-icons/fi';
import styled from 'styled-components';

const StyledToggle = styled.div`
  cursor: pointer;
  height: 25px;
  width: 25px;

  :hover svg {
    color: ${({ theme }) => theme.accentMain};
  }

  .icons {
    height: 25px;
    width: 25px;
    color: ${({ theme }) => theme.textMain};
  }
`;

interface IToggleThemeProps {
  theme: any;
  toggleTheme: any;
}

const ToggleTheme: React.FC<IToggleThemeProps> = ({ theme, toggleTheme }) => {
  return (
    <StyledToggle onClick={toggleTheme}>
      {theme === 'light' ? (
        <RiMoonClearLine className='icons' />
      ) : (
        <FiSun className='icons' />
      )}
    </StyledToggle>
  );
};

export default ToggleTheme;

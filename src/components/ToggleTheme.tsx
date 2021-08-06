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
    height: 100%;
    width: 100%;
    color: ${(props: any) => (props.isMenu ? '#f1f8f7' : props.theme.textMain)};
  }
`;

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

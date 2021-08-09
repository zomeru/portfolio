import React from 'react';
import Link from 'next/link';
import ToggleTheme from './ToggleTheme';
import { navLinks } from '../configs/data';
import { StyledMenu, StyledSidebar } from '../styles/componentStyles';

interface IMenuProps {
  openHamburger: () => void;
  open: boolean;
  theme: string;
  toggleTheme: () => void;
}

const Menu: React.FC<IMenuProps> = ({
  openHamburger,
  open,
  theme,
  toggleTheme,
}) => {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  return (
    // @ts-ignore
    <StyledMenu menuOpen={menuOpen}>
      <ul
        onClick={() => {
          setMenuOpen(!menuOpen);
          openHamburger();
        }}
        className={`hamburger-button ${open ? 'active' : ''}`}
      >
        <li></li>
        <li></li>
        <li></li>
      </ul>
      {open && (
        <>
          <StyledSidebar
            onClick={() => {
              setMenuOpen(false);
              openHamburger();
            }}
          />
          <nav>
            <ul>
              <ToggleTheme
                className='toggle-icon'
                theme={theme}
                toggleTheme={toggleTheme}
              />
              {navLinks.map(({ name, url }) => (
                <li
                  key={name}
                  onClick={() => {
                    setMenuOpen(false);
                    openHamburger();
                  }}
                >
                  <Link href={url}>
                    <a>{name}</a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </StyledMenu>
  );
};

export default Menu;

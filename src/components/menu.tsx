import React from 'react';
import Link from 'next/link';
import { navLinks } from '../configs/data';
import ToggleTheme from './ToggleTheme';
import { StyledMenu, StyledSidebar } from '../styles/componentStyles';

interface IMenuProps {
  variants?: any;
}

const Menu: React.FC<IMenuProps> = ({ variants }) => {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const [open, setOpen] = React.useState<boolean>(false);

  const openHamburger = () => {
    setOpen(open => !open);
  };

  return (
    <StyledMenu variants={variants} open={open} menuOpen={menuOpen}>
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
      <StyledSidebar
        menuOpen={menuOpen}
        onClick={() => {
          setMenuOpen(false);
          openHamburger();
        }}
      />
      <nav>
        <ul>
          <ToggleTheme className='toggle-icon' />
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
    </StyledMenu>
  );
};

export default Menu;

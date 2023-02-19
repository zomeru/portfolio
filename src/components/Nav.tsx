import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import styled from "styled-components";

import ToggleTheme from "./ToggleTheme";
import Menu from "./Menu";
import { navLinks } from "../configs/data";
import { StyledNav, StyledLinks } from "../styles/componentStyles";
import { NavLinksProps } from "@/configs/types";

interface INavProps {
  isHome: boolean;
}

const StyledLogo = styled.div`
  font-weight: bold;
  font-size: 30px;
  color: ${({ theme }) => theme.accentMain};
`;

const Logo = ({ isHome, hostURL }: { isHome: boolean; hostURL: string }) => {
  return (
    <>
      {isHome ? (
        <a href={hostURL}>
          <StyledLogo>ZG</StyledLogo>
        </a>
      ) : (
        <Link href="/" passHref>
          <StyledLogo>ZG</StyledLogo>
        </Link>
      )}
    </>
  );
};

const Nav: React.FC<INavProps> = ({ isHome }) => {
  const [hostURL, setHostURL] = useState<string>("");

  const [prevScrollPos, setPrevScrollPos] = useState<number>(1);
  const [curScrollPos, setCurScrollPos] = useState<number>(0);

  useEffect(() => {
    setCurScrollPos(window.pageYOffset);
    window.onscroll = function () {
      const e = window.pageYOffset;
      setCurScrollPos(e);
      setPrevScrollPos(curScrollPos);
    };
  }, [curScrollPos]);

  //? ANIMATIONS
  const navVariants: Variants = {
    hidden: { opacity: isHome ? 0 : 1 },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.1,
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const navItemVariants: Variants = {
    hidden: {
      y: isHome ? -20 : 0,
      opacity: isHome ? 0 : 1,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: "easeInOut",
        duration: 0.2,
      },
    },
  };

  useEffect(() => {
    setHostURL(`${window.location.protocol}//${window.location.host}`);
  }, []);

  const [innerText, setInnerText] = useState("");

  const activeLinkHandler = (e: React.MouseEvent<HTMLLIElement>): void => {
    const input = e.target as HTMLElement;
    setInnerText(input.innerText);
  };

  return (
    <StyledNav
      id="nav"
      prevScrollPos={prevScrollPos}
      curScrollPos={curScrollPos}
    >
      <motion.nav
        className="nav"
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.span className="logo" variants={navItemVariants}>
          <Logo isHome={isHome} hostURL={hostURL} />
        </motion.span>
        <StyledLinks>
          <ul>
            {/* @ts-ignore */}
            {navLinks[`${isHome ? "home" : "otherPage"}`].map(
              ({ url, name }: NavLinksProps, i: number) => {
                return (
                  <motion.li
                    onClick={activeLinkHandler}
                    variants={navItemVariants}
                    key={i}
                  >
                    <Link href={url} passHref>
                      <a
                        className={`link ${
                          name === innerText ? "active-link" : ""
                        }`}
                      >
                        {name}
                      </a>
                    </Link>
                  </motion.li>
                );
              }
            )}
            <motion.li
              onClick={activeLinkHandler}
              key={`${
                isHome ? navLinks["home"].length : navLinks["otherPage"].length
              }`}
              variants={navItemVariants}
            >
              <ToggleTheme />
            </motion.li>
          </ul>
        </StyledLinks>
        <Menu variants={navItemVariants} isHome={isHome} />
      </motion.nav>
    </StyledNav>
  );
};

export default Nav;

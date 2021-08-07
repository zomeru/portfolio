import React from 'react';
import styled from 'styled-components';
import NameLoader from './icons/NameLoader';
import { motion } from 'framer-motion';

const StyledLoader = styled(motion.section)`
  /* margin-bottom: 0px; */
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface IloaderProps {
  isLoaded: boolean;
  notLoaded: boolean;
  variants: any;
  initial: string;
  animate: string;
  exit: string;
}

const Loader: React.FC<IloaderProps> = ({
  isLoaded,
  notLoaded,
  variants,
  initial,
  animate,
  exit,
}) => {
  return (
    <StyledLoader
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
    >
      <NameLoader />
    </StyledLoader>
  );
};

export default Loader;

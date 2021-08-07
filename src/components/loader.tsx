import React from 'react';
import styled from 'styled-components';
import NameLoader from './icons/NameLoader';
import { motion } from 'framer-motion';

const StyledLoader = styled(motion.section)`
  height: calc(100vh - 50px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 100px 0 100px;

  @media only screen and (max-width: 480px) {
    padding: 0 50px 0 50px;
  }
`;

interface IloaderProps {}

const Loader: React.FC<IloaderProps> = ({}) => {
  return (
    <StyledLoader>
      <NameLoader />
    </StyledLoader>
  );
};

export default Loader;

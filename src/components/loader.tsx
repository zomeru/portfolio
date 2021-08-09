import React from 'react';
import NameLoader from './icons/NameLoader';
import { StyledLoader } from '../styles/componentStyles';

interface IloaderProps {}

const Loader: React.FC<IloaderProps> = ({}) => {
  return (
    <StyledLoader>
      <NameLoader />
    </StyledLoader>
  );
};

export default Loader;

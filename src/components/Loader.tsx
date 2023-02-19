import React from "react";
import NameLoader from "./icons/NameLoader";
import { StyledLoader } from "../styles/componentStyles";

const Loader = ({ finishLoading }: { finishLoading: () => void }) => {
  return (
    <StyledLoader
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <NameLoader finishLoading={finishLoading} />
    </StyledLoader>
  );
};

export default Loader;

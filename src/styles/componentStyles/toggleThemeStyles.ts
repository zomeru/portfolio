import { motion } from 'framer-motion';
import styled from 'styled-components';

export const StyledToggle = styled(motion.div)`
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

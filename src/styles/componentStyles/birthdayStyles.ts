import styled from 'styled-components';
import { motion } from 'framer-motion';

export const StyledBirthday = styled(motion.section)`
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.textMain};

  h1 {
    font-weight: 700;
    font-size: clamp(35px, 6.5vw, 60px);
    margin-bottom: 10px;

    @media only screen and (max-width: 420px) {
      font-size: 30px;
    }
  }

  h2 {
    font-size: clamp(16px, 5vw, 28px);
  }
`;

import styled from 'styled-components';
import { motion } from 'framer-motion';

export const StyledTechStacks = styled(motion.div)`
  margin: 70px auto 0 auto;
  text-align: center;

  h1 {
    font-size: 30px;
    margin-bottom: var(--mg-sm);
  }

  > p {
    color: ${({ theme }) => theme.textSecond};
  }
`;

export const StyledTech = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin-top: var(--mg-lg);

  ul {
    max-width: 80%;
    display: flex;
    flex-flow: wrap;
    justify-content: center;

    @media only screen and (max-width: 1080px) {
      max-width: 85%;
    }

    @media only screen and (max-width: 768px) {
      max-width: 100%;
    }
  }

  li {
    border: 1px solid ${({ theme }) => theme.accentMain};
    height: 55px;
    width: auto;
    border-radius: 3px;
    overflow: hidden;
    display: inline-block;
    margin: 0 10px 15px 10px;

    .tech-content {
      display: flex;
      align-items: center;
      height: 100%;

      .logo {
        margin-left: 10px;
        margin-right: 20px;
        width: 30px;
        height: 30px;
        color: ${({ theme }) => theme.accentMain};
      }

      p {
        margin-right: 10px;
        color: ${({ theme }) => theme.textSecond};
      }
    }
  }
`;

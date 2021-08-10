import styled from 'styled-components';
import { motion } from 'framer-motion';

export const StyledProjects = styled(motion.section)`
  height: auto;
  padding: 50px 100px 0 100px;

  @media only screen and (max-width: 1000px) {
    padding: 50px 50px 0 50px;
  }

  @media only screen and (max-width: 900px) {
    padding: 50px 0 0 0;
  }

  @media only screen and (max-width: 768px) {
    padding: 50px 100px 0 100px;
  }

  @media only screen and (max-width: 650px) {
    padding: 50px 50px 0 50px;
  }

  @media only screen and (max-width: 600px) {
    padding: 50px 0 0 0;
  }
`;

export const StyledProjectCardContainer = styled(motion.ul)`
  height: auto;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: 30px;

  @media only screen and (max-width: 768px) {
    grid-template-columns: repeat(1, 1fr);
  }

  .project-card {
    height: 300px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;

    @media only screen and (max-width: 400px) {
      height: 250px;
    }

    :hover .overlay {
      opacity: 0.5;
    }

    :hover .project-details {
      background-color: #102039;
      opacity: 0.7;
    }

    :hover .project-techs {
      color: #f1f8f7;
    }

    :hover .project-info {
      color: #f1f8f7;
    }
  }

  .project-details {
    margin: 0 40px;
    padding: 10px;
    border-radius: 4px;
    color: white;
    width: 100%;
    z-index: 79;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.3s ease-in-out;

    @media only screen and (max-width: 1000px) {
      margin: 0 25px;
    }

    @media only screen and (max-width: 900px) {
      margin: 0 15px;
    }

    @media only screen and (max-width: 768px) {
      margin: 0 25px;
    }

    @media only screen and (max-width: 400px) {
      margin: 0 10px;
    }
  }

  .project-title {
    font-size: 25px;
    margin-bottom: 10px;

    @media only screen and (max-width: 480px) {
      font-size: 20px;
    }
  }

  .project-info {
    margin-bottom: 10px;
    color: #a6a6a6;
    transition: all 0.2s ease-in-out;
  }

  .project-techs {
    margin-bottom: 15px;
    color: #a6a6a6;
    transition: all 0.2s ease-in-out;
  }

  .project-techs span:not(:last-child) {
    margin-right: 10px;
  }

  .project-buttons a:not(:last-child) {
    margin-right: 10px;
  }

  .project-button {
    width: 25px;
    height: 25px;
    color: #f1f8f7;
    transition: all 0.2s ease-in-out;

    :hover {
      color: ${({ theme }) => theme.accentMain};
    }
  }
`;

export const StyledProjectCardImage = styled.div`
  height: 100%;
  width: 100%;
  z-index: -1;
  position: absolute;
  top: 0;
  left: 0;

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: #102039;
    transition: all 0.3s ease-in-out;
    opacity: 0.9;
  }
`;

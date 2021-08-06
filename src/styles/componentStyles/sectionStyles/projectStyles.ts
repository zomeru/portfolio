import styled from 'styled-components';

export const StyledProjects = styled.section`
  height: auto;
  padding: 50px;

  @media only screen and (max-width: 1000px) {
    padding: 0;
  }
`;

export const StyledProjectGrid = styled.ul`
  width: 100%;

  :not(:last-child) {
    margin-bottom: 35px;
  }

  li {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: 12px;
    position: relative;
    border-radius: 3px;
    overflow: hidden;

    @media only screen and (max-width: 900px) {
      grid-gap: 5px;
    }
  }

  img {
    width: 100%;
  }

  .project-image {
    z-index: 55;
    padding: 25px;
    width: 100%;
    background-color: ${({ theme }) => theme.contentBG};
    border: 3px solid ${({ theme }) => theme.contentBGSec};
    border-radius: 5px;
    overflow: hidden;
    grid-column: 1/8;

    @media only screen and (max-width: 900px) {
      padding: 10px;
    }

    @media only screen and (max-width: 768px) {
      grid-column: 1/13;
      grid-row: 1;
      border: 0px solid ${({ theme }) => theme.contentBGSec};
    }
  }

  .opaque-bg {
    display: none;
    width: 100%;
    height: 100%;
    background-color: #102039;
    filter: blur(4px);
    -webkit-filter: blur(4px);
    overflow: hidden;
    z-index: 66;
    opacity: 0.85;

    @media only screen and (max-width: 768px) {
      display: block;
      grid-column: 1/13;
      grid-row: 1;
    }
  }

  .project-details {
    z-index: 88;
    margin-left: 20px;
    width: 100%;
    grid-column: 8 / 13;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media only screen and (max-width: 768px) {
      width: 80%;
      height: 60%;
      margin-top: 20px;
      grid-column: 1/13;
      grid-row: 1;
      justify-self: center;
      align-self: center;
    }
  }

  .project-name {
    font-size: 30px;
    margin-bottom: 20px;

    @media only screen and (max-width: 900px) {
      font-size: 25px;
      margin-bottom: 15px;
    }

    @media only screen and (max-width: 768px) {
      color: #f1f8f7;
    }

    @media only screen and (max-width: 480px) {
      font-size: 20px;
    }

    @media only screen and (max-width: 427px) {
      margin-bottom: 5px;
    }
  }

  .project-info {
    color: ${({ theme }) => theme.textSecond};
    margin-bottom: 20px;

    @media only screen and (max-width: 900px) {
      margin-bottom: 15px;
    }

    @media only screen and (max-width: 768px) {
      color: #cfe7e4;
    }

    @media only screen and (max-width: 427px) {
      margin-bottom: 5px;
    }
  }

  .project-tech {
    color: ${({ theme }) => theme.textSecond};
    margin-bottom: 40px;

    @media only screen and (max-width: 900px) {
      margin-bottom: 30px;
    }

    @media only screen and (max-width: 768px) {
      color: #cfe7e4;
    }

    @media only screen and (max-width: 427px) {
      margin-bottom: 10px;
    }

    span {
      :not(:last-child) {
        margin-right: 15px;
      }
    }
  }

  .project-buttons {
    display: flex;
    align-items: center;

    a :not(:last-child) {
      margin-right: 15px;
    }

    .buttons {
      width: 30px;
      height: 30px;

      @media only screen and (max-width: 900px) {
        width: 25px;
        height: 25px;
      }

      @media only screen and (max-width: 768px) {
        color: #f1f8f7;
        width: 30px;
        height: 30px;
        transition: color 0.3s ease-in-out;

        :hover {
          color: ${({ theme }) => theme.accentMain};
        }
      }

      @media only screen and (max-width: 480px) {
        width: 23px;
        height: 23px;
      }

      @media only screen and (max-width: 420px) {
        width: 20px;
        height: 20px;
      }
    }
  }
`;

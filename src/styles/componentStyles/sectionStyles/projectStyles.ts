import styled from 'styled-components';

export const StyledProjects = styled.section`
  height: auto;
  padding: 50px;
`;

export const StyledProjectGrid = styled.ul`
  width: 100%;

  :not(:last-child) {
    margin-bottom: 35px;
  }

  li {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(6, 50px);
    grid-gap: 12px;
    position: relative;
  }

  img {
    width: 100%;
  }

  .project-image {
    padding: 25px 25px 0 25px;
    width: 100%;
    background-color: rgba(144, 202, 249, 0.25);
    border: 3px solid rgba(144, 202, 249, 0.35);
    border-radius: 5px;
    overflow: hidden;
    grid-column: 1/8;
    grid-row: 1/7;

    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(7, 50px);
  }

  .image-1 {
    width: 100%;
    grid-column: 1/11;
    grid-row: 1 / 6;
  }

  .image-2 {
    width: 100%;
    grid-column: 4 / 13;
    grid-row: 4 / 8;
  }

  .project-details {
    margin-left: 20px;
    width: 100%;
    grid-column: 8 / 13;
    grid-row: 1 / 7;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .project-name {
    font-size: 30px;
    margin-bottom: 20px;
  }

  .project-info {
    color: var(--gray-light);
    margin-bottom: 20px;
  }

  .project-tech {
    color: var(--gray-light);
    margin-bottom: 40px;

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
    }
  }
`;

import styled from 'styled-components';

const StyledButton = styled.a`
  position: relative;
  min-width: 200px;
  min-height: 50px;
  max-width: 200px;
  max-height: 50px;
  text-decoration: none;
  display: flex;
  text-align: center;
  justify-content: center;
  align-items: center;
  border: 2px solid ${({ theme }) => theme.accentMain};
  border-radius: 3px;
  text-transform: uppercase;
  overflow: hidden;

  :link,
  :visited {
    color: ${({ theme }) => theme.textSecond};
  }

  ::before {
    content: '';
    position: absolute;
    min-width: 202px;
    min-height: 52px;
    max-width: 202px;
    max-height: 52px;
    top: -2px;
    left: -2px;
    right: 0;
    bottom: 0;
    background-color: ${({ theme }) => theme.accentMain};
    z-index: -1;
    transform: scaleX(0.1);
    transform-origin: left;
    transition: all 0.3s ease-in-out;
  }

  :hover::before {
    transform: scaleX(1);
  }

  :hover .line::before {
    opacity: 1;
    transform: scaleX(1);
    background-color: #f1f8f7;
  }

  :hover p {
    margin-left: 20px;
    color: #f1f8f7;
  }

  .line::before {
    content: '';
    position: absolute;
    background-color: ${({ theme }) => theme.body};
    width: 25px;
    height: 1px;
    top: 50%;
    left: 0;
    bottom: 0;
    right: 0;
    transform: scaleX(0);
    transform-origin: left;
    opacity: 0;
    margin-left: 30px;
    transition: transform 0.3s ease-in-out;
  }

  p {
    position: relative;
    margin-left: -30px;
    z-index: 10;
    transition: all 0.3s ease-in-out;
    font-weight: var(--font-semibold);
    font-size: var(--fz-sm);
    /* justify-self: center; */
  }
`;

export default StyledButton;

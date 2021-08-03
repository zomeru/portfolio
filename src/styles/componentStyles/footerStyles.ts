import styled from 'styled-components';

export const StyledFooter = styled.footer`
  text-align: center;
  width: 100%;
  margin: 0 auto;
  padding-bottom: 30px;

  a {
    font-size: var(--fz-sm);
    font-weight: var(--font-semibold);
  }
`;

export const StyledSocialLinks = styled.div`
  height: 50px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;

  a {
    padding: 5px;
    transition: transform 0.2s ease-out;

    :not(:last-child) {
      margin-right: 25px;
    }

    :hover {
      transform: translateY(-7px);
    }
  }

  .icon {
    width: 22px;
    height: 22px;
  }
`;

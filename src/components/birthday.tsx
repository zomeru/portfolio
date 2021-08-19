import React from 'react';
import { StyledBirthday } from '../styles/componentStyles/birthdayStyles';

interface BirthdayProps {}

const Birthday: React.FC<BirthdayProps> = ({}) => {
  const bdayVar = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeInOut',
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        ease: 'easeInOut',
        duration: 0.5,
      },
    },
  };

  return (
    <StyledBirthday
      initial='hidden'
      animate='visible'
      variants={bdayVar}
      exit='exit'
    >
      <h1>Hi, it&lsquo;s my birthday.</h1>
      <h2>Thank you for visiting my website. 😊</h2>
    </StyledBirthday>
  );
};

export default Birthday;

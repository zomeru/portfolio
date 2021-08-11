import { useRouter } from 'next/router';

const Linkedin = () => {
  const router = useRouter();
  router.push('https://linkedin.com/in/zomergregorio');
  return null;
};

export default Linkedin;

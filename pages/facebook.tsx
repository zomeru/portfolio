import { useRouter } from 'next/router';

const Facebook = () => {
  const router = useRouter();
  router.push('https://facebook.com/Zomeru');
  return null;
};

export default Facebook;

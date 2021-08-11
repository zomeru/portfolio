import { useRouter } from 'next/router';

const Twitter = () => {
  const router = useRouter();
  router.push('https://twitter.com/zomeru_sama');
  return null;
};

export default Twitter;

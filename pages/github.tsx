import { useRouter } from 'next/router';

const Github = () => {
  const router = useRouter();
  router.push('https://github.com/zomeru');
  return null;
};

export default Github;

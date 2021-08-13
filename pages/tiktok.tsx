import { useRouter } from 'next/router';

const Tiktok = () => {
  const router = useRouter();
  router.push('https://tiktok.com/@zomeru_sama');
  return null;
};

export default Tiktok;

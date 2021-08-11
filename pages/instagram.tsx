import { useRouter } from 'next/router';

const Instagram = () => {
  const router = useRouter();
  router.push('https://instagram.com/zomerusama');
  return null;
};

export default Instagram;

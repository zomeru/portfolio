import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import { Hero } from '../src/components/index';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Zomer Gregorio</title>
        <meta name='description' content='Zomer Gregorio Portfolio' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        <Hero />
      </main>
    </div>
  );
}

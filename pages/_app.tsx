import type { AppProps } from 'next/app';
import { GlobalStyles } from '../src/styles';
import '../styles/styles.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* <GlobalStyles /> */}
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;

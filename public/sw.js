if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let s=Promise.resolve();return a[e]||(s=new Promise((async s=>{if("document"in self){const a=document.createElement("script");a.src=e,document.head.appendChild(a),a.onload=s}else importScripts(e),s()}))),s.then((()=>{if(!a[e])throw new Error(`Module ${e} didn’t register its module`);return a[e]}))},s=(s,a)=>{Promise.all(s.map(e)).then((e=>a(1===e.length?e[0]:e)))},a={require:Promise.resolve(s)};self.define=(s,i,n)=>{a[s]||(a[s]=Promise.resolve().then((()=>{let a={};const c={uri:location.origin+s.slice(1)};return Promise.all(i.map((s=>{switch(s){case"exports":return a;case"module":return c;default:return e(s)}}))).then((e=>{const s=n(...e);return a.default||(a.default=s),a}))})))}}define("./sw.js",["./workbox-e6f19720"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/BLj3TMQfkqZpbaqmj2E3k/_buildManifest.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/BLj3TMQfkqZpbaqmj2E3k/_ssgManifest.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/1a48c3c1-d6debe6c9b1a70b61a86.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/1bfc9850-3aca2da77bfed37be948.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/486-f4ff6a9f5df8f8da6fbd.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/772-891caa3f3e6bec276f89.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/78e521c3-5e4e98be6e4f958c3e69.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/810-0f1ab707b38b2eeb2208.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/831.f67b5c94ba0012bae9ab.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/95b64a6e-d487eccd9af71d050ea0.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/d0447323-8751fd3916d37a2cc93d.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/d7eeaac4-a0118cf1de5231645dd5.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/framework-92300432a1172ef1338b.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/main-80a2da2ae7ac76a3163d.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/404-e53ede8976c62742955a.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/_app-ebbc2c0b0f1a139aec2f.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/_error-82a806cd39f8ab3dc3ac.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/facebook-5ca1cc500a32bc9fc1e6.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/github-48d2767e8c88501ace5a.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/index-650ef832dc128a6e2587.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/instagram-ccc674d95154eb4df0b5.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/linkedin-4988d67030c2027ac1f2.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/tiktok-a54ddb9344e4a28f38bd.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/pages/twitter-d86a653d72d79abbbaea.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/polyfills-a54b4f32bdc1ef890ddd.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/chunks/webpack-57b46bbd0c64a0910f36.js",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/projects/forkify-min.5da3aea704036e7ec783ed4d4356cf96.webp",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/projects/pig-dice-game-min.f0b830e6caa95aed4d96cd8d139c1f14.webp",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/projects/simple-portfolio-min.24ee3dc6cdcff65e0c35153c92147fb1.webp",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/projects/zomify-colors-min.d23cce717be9281b1729e438e207cf41.webp",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/zoms-square.8f4538582de8f67c922b98d01e0d2de5.jpg",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/_next/static/image/src/assets/images/zoms.f91f874fe71fe58b48dd0ffcade32671.jpg",revision:"BLj3TMQfkqZpbaqmj2E3k"},{url:"/browserconfig.xml",revision:"20d3c4125daa57621be40449ec2c15a0"},{url:"/favicon.ico",revision:"31f189359d052d36da8c537fba4709d9"},{url:"/icons/android-chrome-512x512.png",revision:"9412a158dfc0109e0d39b4bcc2bbf144"},{url:"/icons/android-icon-144x144.png",revision:"555d643cbe8e2f528c36637b5772cd8f"},{url:"/icons/android-icon-192x192.png",revision:"d2eb4b4a7525cf58135b22c3bc883d2a"},{url:"/icons/android-icon-36x36.png",revision:"cec1ebae896f638fd7e46fe517f69ab3"},{url:"/icons/android-icon-48x48.png",revision:"23574ebc62f68d4d808a9f933297240e"},{url:"/icons/android-icon-72x72.png",revision:"05343fe22d5b5cf172d4bac5ac1abfb8"},{url:"/icons/android-icon-96x96.png",revision:"69e2e5fe69122a9a3d035165d0da033b"},{url:"/icons/apple-icon-114x114.png",revision:"c4da88ba5b72044bd0ba01eaa2ec247a"},{url:"/icons/apple-icon-120x120.png",revision:"4784e6cbc011f0233b5023ab34ac1e5a"},{url:"/icons/apple-icon-144x144.png",revision:"722229232d83930b0f8bb6d3cbcb33ef"},{url:"/icons/apple-icon-152x152.png",revision:"41c8d7d7c5d27d4ea714890a5a7d4302"},{url:"/icons/apple-icon-180x180.png",revision:"2f7196092a13343b1bd41a553247227f"},{url:"/icons/apple-icon-57x57.png",revision:"ed6e19b978605c8384432034c6154839"},{url:"/icons/apple-icon-60x60.png",revision:"5854b7eb1790c90aa525e2370435090c"},{url:"/icons/apple-icon-72x72.png",revision:"8ab15318be685d0f0b4a94fd7a8a3e0e"},{url:"/icons/apple-icon-76x76.png",revision:"97e7bfbb8827197189f32d18510d8a5d"},{url:"/icons/apple-icon-precomposed.png",revision:"43afcf70b1f682a8551d217bad1da1ac"},{url:"/icons/apple-icon.png",revision:"b6404e916022d3385dff30c0723c36d5"},{url:"/icons/favicon-16x16.png",revision:"d223dd9c6844d4364ae359cb4f67c95e"},{url:"/icons/favicon-32x32.png",revision:"bb2dc7cd20cfb385bd0f7a13c95e2b63"},{url:"/icons/favicon-96x96.png",revision:"e5cec928f26654466526cb9f4db3fcdd"},{url:"/icons/mask-icon.svg",revision:"da523ef806f81ee149d46f5a0add3f2a"},{url:"/icons/ms-icon-144x144.png",revision:"001ca8185baebbc0c410acf614c4a8f2"},{url:"/icons/ms-icon-150x150.png",revision:"909a6f066181eb738753b6b776ce3636"},{url:"/icons/ms-icon-310x310.png",revision:"f4806bc890614a0e873a556feb9117fc"},{url:"/icons/ms-icon-70x70.png",revision:"7b2a4f33c22f081112625a07ca8ed5e9"},{url:"/robots.txt",revision:"6ed43699d6e99451e76d99444e67a2e5"},{url:"/site.webmanifest",revision:"9662f0577ecf27508122388a9cdd6adc"},{url:"/sitemap.xml",revision:"ce474c750b4dfbdd16a0a624af416b7c"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:i})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|mp4)$/i,new e.StaleWhileRevalidate({cacheName:"static-media-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));

!function(){"use strict";var e={913:function(){try{self["workbox:core:6.2.2"]&&_()}catch(e){}},550:function(){try{self["workbox:expiration:6.2.2"]&&_()}catch(e){}},977:function(){try{self["workbox:precaching:6.2.2"]&&_()}catch(e){}},80:function(){try{self["workbox:routing:6.2.2"]&&_()}catch(e){}},873:function(){try{self["workbox:strategies:6.2.2"]&&_()}catch(e){}}},t={};function s(n){var a=t[n];if(void 0!==a)return a.exports;var r=t[n]={exports:{}},i=!0;try{e[n](r,r.exports,s),i=!1}finally{i&&delete t[n]}return r.exports}!function(){s(913);const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const n=new Set;const a={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!==typeof registration?registration.scope:""},r=e=>[a.prefix,e,a.suffix].filter((e=>e&&e.length>0)).join("-"),i=e=>e||r(a.precache),c=e=>e||r(a.runtime);function o(e,t){const s=new URL(e);for(const n of t)s.searchParams.delete(n);return s.href}let h;function l(e){e.then((()=>{}))}class u{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const d=e=>new URL(String(e),location.href).href.replace(new RegExp(`^${location.origin}`),"");function f(e){return new Promise((t=>setTimeout(t,e)))}function p(e,t){const s=t();return e.waitUntil(s),s}async function g(e,s){let n=null;if(e.url){n=new URL(e.url).origin}if(n!==self.location.origin)throw new t("cross-origin-copy-response",{origin:n});const a=e.clone(),r={headers:new Headers(a.headers),status:a.status,statusText:a.statusText},i=s?s(r):r,c=function(){if(void 0===h){const t=new Response("");if("body"in t)try{new Response(t.body),h=!0}catch(e){h=!1}h=!1}return h}()?a.body:await a.blob();return new Response(c,i)}let m,w;const y=new WeakMap,_=new WeakMap,v=new WeakMap,b=new WeakMap,x=new WeakMap;let R={get(e,t,s){if(e instanceof IDBTransaction){if("done"===t)return _.get(e);if("objectStoreNames"===t)return e.objectStoreNames||v.get(e);if("store"===t)return s.objectStoreNames[1]?void 0:s.objectStore(s.objectStoreNames[0])}return T(e[t])},set:(e,t,s)=>(e[t]=s,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function E(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(w||(w=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(k(this),t),T(y.get(this))}:function(...t){return T(e.apply(k(this),t))}:function(t,...s){const n=e.call(k(this),t,...s);return v.set(n,t.sort?t.sort():[t]),T(n)}}function C(e){return"function"===typeof e?E(e):(e instanceof IDBTransaction&&function(e){if(_.has(e))return;const t=new Promise(((t,s)=>{const n=()=>{e.removeEventListener("complete",a),e.removeEventListener("error",r),e.removeEventListener("abort",r)},a=()=>{t(),n()},r=()=>{s(e.error||new DOMException("AbortError","AbortError")),n()};e.addEventListener("complete",a),e.addEventListener("error",r),e.addEventListener("abort",r)}));_.set(e,t)}(e),t=e,(m||(m=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,R):e);var t}function T(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,s)=>{const n=()=>{e.removeEventListener("success",a),e.removeEventListener("error",r)},a=()=>{t(T(e.result)),n()},r=()=>{s(e.error),n()};e.addEventListener("success",a),e.addEventListener("error",r)}));return t.then((t=>{t instanceof IDBCursor&&y.set(t,e)})).catch((()=>{})),x.set(t,e),t}(e);if(b.has(e))return b.get(e);const t=C(e);return t!==e&&(b.set(e,t),x.set(t,e)),t}const k=e=>x.get(e);const L=["get","getKey","getAll","getAllKeys","count"],q=["put","add","delete","clear"],U=new Map;function D(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!==typeof t)return;if(U.get(t))return U.get(t);const s=t.replace(/FromIndex$/,""),n=t!==s,a=q.includes(s);if(!(s in(n?IDBIndex:IDBObjectStore).prototype)||!a&&!L.includes(s))return;const r=async function(e,...t){const r=this.transaction(e,a?"readwrite":"readonly");let i=r.store;return n&&(i=i.index(t.shift())),(await Promise.all([i[s](...t),a&&r.done]))[0]};return U.set(t,r),r}R=(e=>({...e,get:(t,s,n)=>D(t,s)||e.get(t,s,n),has:(t,s)=>!!D(t,s)||e.has(t,s)}))(R);s(550);const N="cache-entries",S=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class P{constructor(e){this._db=null,this._cacheName=e}_upgradeDb(e){const t=e.createObjectStore(N,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&function(e,{blocked:t}={}){const s=indexedDB.deleteDatabase(e);t&&s.addEventListener("blocked",(()=>t())),T(s).then((()=>{}))}(this._cacheName)}async setTimestamp(e,t){const s={url:e=S(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)},n=await this.getDb();await n.put(N,s)}async getTimestamp(e){const t=await this.getDb(),s=await t.get(N,this._getId(e));return null===s||void 0===s?void 0:s.timestamp}async expireEntries(e,t){const s=await this.getDb();let n=await s.transaction(N).store.index("timestamp").openCursor(null,"prev");const a=[];let r=0;for(;n;){const s=n.value;s.cacheName===this._cacheName&&(e&&s.timestamp<e||t&&r>=t?a.push(n.value):r++),n=await n.continue()}const i=[];for(const c of a)await s.delete(N,c.id),i.push(c.url);return i}_getId(e){return this._cacheName+"|"+S(e)}async getDb(){return this._db||(this._db=await function(e,t,{blocked:s,upgrade:n,blocking:a,terminated:r}={}){const i=indexedDB.open(e,t),c=T(i);return n&&i.addEventListener("upgradeneeded",(e=>{n(T(i.result),e.oldVersion,e.newVersion,T(i.transaction))})),s&&i.addEventListener("blocked",(()=>s())),c.then((e=>{r&&e.addEventListener("close",(()=>r())),a&&e.addEventListener("versionchange",(()=>a()))})).catch((()=>{})),c}("workbox-expiration",1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class A{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new P(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const n of t)await s.delete(n,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,l(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){const t=await this._timestampModel.getTimestamp(e),s=Date.now()-1e3*this._maxAgeSeconds;return void 0===t||t<s}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class M{constructor(e={}){this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:n})=>{if(!n)return null;const a=this._isResponseDateFresh(n),r=this._getCacheExpiration(s);l(r.expireEntries());const i=r.updateTimestamp(t.url);if(e)try{e.waitUntil(i)}catch(c){0}return a?n:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&function(e){n.add(e)}((()=>this.deleteCacheAndMetadata()))}_getCacheExpiration(e){if(e===c())throw new t("expire-custom-caches-only");let s=this._cacheExpirations.get(e);return s||(s=new A(e,this._config),this._cacheExpirations.set(e,s)),s}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}s(873);function O(e){return"string"===typeof e?new Request(e):e}class I{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new u,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let n=O(e);if("navigate"===n.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const a=this.hasCallback("fetchDidFail")?n.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))n=await e({request:n.clone(),event:s})}catch(i){if(i instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:i.message})}const r=n.clone();try{let e;e=await fetch(n,"navigate"===n.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:r,response:e});return e}catch(c){throw a&&await this.runCallbacks("fetchDidFail",{error:c,event:s,originalRequest:a.clone(),request:r.clone()}),c}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=O(e);let s;const{cacheName:n,matchOptions:a}=this._strategy,r=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},a),{cacheName:n});s=await caches.match(r,i);for(const c of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await c({cacheName:n,matchOptions:a,cachedResponse:s,request:r,event:this.event})||void 0;return s}async cachePut(e,s){const a=O(e);await f(0);const r=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:d(r.url)});const i=await this._ensureResponseSafeToCache(s);if(!i)return!1;const{cacheName:c,matchOptions:h}=this._strategy,l=await self.caches.open(c),u=this.hasCallback("cacheDidUpdate"),p=u?await async function(e,t,s,n){const a=o(t.url,s);if(t.url===a)return e.match(t,n);const r=Object.assign(Object.assign({},n),{ignoreSearch:!0}),i=await e.keys(t,r);for(const c of i)if(a===o(c.url,s))return e.match(c,n)}(l,r.clone(),["__WB_REVISION__"],h):null;try{await l.put(r,u?i.clone():i)}catch(g){if(g instanceof Error)throw"QuotaExceededError"===g.name&&await async function(){for(const e of n)await e()}(),g}for(const t of this.iterateCallbacks("cacheDidUpdate"))await t({cacheName:c,oldResponse:p,newResponse:i.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){if(!this._cacheKeys[t]){let s=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))s=O(await e({mode:t,request:s,event:this.event,params:this.params}));this._cacheKeys[t]=s}return this._cacheKeys[t]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"===typeof t[e]){const s=this._pluginStateMap.get(t),n=n=>{const a=Object.assign(Object.assign({},n),{state:s});return t[e](a)};yield n}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const n of this.iterateCallbacks("cacheWillUpdate"))if(t=await n({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class K{constructor(e={}){this.cacheName=c(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"===typeof e.request?new Request(e.request):e.request,n="params"in e?e.params:void 0,a=new I(this,{event:t,request:s,params:n}),r=this._getResponse(a,s,t);return[r,this._awaitComplete(r,a,s,t)]}async _getResponse(e,s,n){let a;await e.runCallbacks("handlerWillStart",{event:n,request:s});try{if(a=await this._handle(s,e),!a||"error"===a.type)throw new t("no-response",{url:s.url})}catch(r){if(r instanceof Error)for(const t of e.iterateCallbacks("handlerDidError"))if(a=await t({error:r,event:n,request:s}),a)break;if(!a)throw r}for(const t of e.iterateCallbacks("handlerWillRespond"))a=await t({event:n,request:s,response:a});return a}async _awaitComplete(e,t,s,n){let a,r;try{a=await e}catch(r){}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:a}),await t.doneWaiting()}catch(i){i instanceof Error&&(r=i)}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:a,error:r}),t.destroy(),r)throw r}}const W={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};class j extends K{constructor(e={}){super(e),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(W),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,s){const n=[];const a=[];let r;if(this._networkTimeoutSeconds){const{id:t,promise:i}=this._getTimeoutPromise({request:e,logs:n,handler:s});r=t,a.push(i)}const i=this._getNetworkPromise({timeoutId:r,request:e,logs:n,handler:s});a.push(i);const c=await s.waitUntil((async()=>await s.waitUntil(Promise.race(a))||await i)());if(!c)throw new t("no-response",{url:e.url});return c}_getTimeoutPromise({request:e,logs:t,handler:s}){let n;return{promise:new Promise((t=>{n=setTimeout((async()=>{t(await s.cacheMatch(e))}),1e3*this._networkTimeoutSeconds)})),id:n}}async _getNetworkPromise({timeoutId:e,request:t,logs:s,handler:n}){let a,r;try{r=await n.fetchAndCachePut(t)}catch(i){i instanceof Error&&(a=i)}return e&&clearTimeout(e),!a&&r||(r=await n.cacheMatch(t)),r}}class B extends K{constructor(e={}){super(e),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(W)}async _handle(e,s){const n=s.fetchAndCachePut(e).catch((()=>{}));let a,r=await s.cacheMatch(e);if(r)0;else{0;try{r=await n}catch(i){i instanceof Error&&(a=i)}}if(!r)throw new t("no-response",{url:e.url,error:a});return r}}s(80);const H=e=>e&&"object"===typeof e?e:{handle:e};class F{constructor(e,t,s="GET"){this.handler=H(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=H(e)}}class $ extends F{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class G{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data;0;const s=Promise.all(t.urlsToCache.map((t=>{"string"===typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return void 0;const n=s.origin===location.origin,{params:a,route:r}=this.findMatchingRoute({event:t,request:e,sameOrigin:n,url:s});let i=r&&r.handler;const c=e.method;if(!i&&this._defaultHandlerMap.has(c)&&(i=this._defaultHandlerMap.get(c)),!i)return void 0;let o;try{o=i.handle({url:s,request:e,event:t,params:a})}catch(l){o=Promise.reject(l)}const h=r&&r.catchHandler;return o instanceof Promise&&(this._catchHandler||h)&&(o=o.catch((async n=>{if(h){0;try{return await h.handle({url:s,request:e,event:t,params:a})}catch(r){r instanceof Error&&(n=r)}}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw n}))),o}findMatchingRoute({url:e,sameOrigin:t,request:s,event:n}){const a=this._routes.get(s.method)||[];for(const r of a){let a;const i=r.match({url:e,sameOrigin:t,request:s,event:n});if(i)return a=i,(Array.isArray(a)&&0===a.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"===typeof i)&&(a=void 0),{route:r,params:a}}return{}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,H(e))}setCatchHandler(e){this._catchHandler=H(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new t("unregister-route-but-not-found-with-method",{method:e.method});const s=this._routes.get(e.method).indexOf(e);if(!(s>-1))throw new t("unregister-route-route-not-registered");this._routes.get(e.method).splice(s,1)}}let Q;const V=()=>(Q||(Q=new G,Q.addFetchListener(),Q.addCacheListener()),Q);function J(e,s,n){let a;if("string"===typeof e){const t=new URL(e,location.href);0;a=new F((({url:e})=>e.href===t.href),s,n)}else if(e instanceof RegExp)a=new $(e,s,n);else if("function"===typeof e)a=new F(e,s,n);else{if(!(e instanceof F))throw new t("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});a=e}return V().registerRoute(a),a}s(977);function z(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"===typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:n}=e;if(!n)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(n,location.href);return{cacheKey:e.href,url:e.href}}const a=new URL(n,location.href),r=new URL(n,location.href);return a.searchParams.set("__WB_REVISION__",s),{cacheKey:a.href,url:r.href}}class X{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class Y{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=t&&t.cacheKey||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s):e},this._precacheController=e}}class Z extends K{constructor(e={}){e.cacheName=i(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(Z.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let n;if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return n=await s.fetch(e),n}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const n=await s.fetch(e);if(!(await s.cachePut(e,n.clone())))throw new t("bad-precaching-response",{url:e.url,status:n.status});return n}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==Z.copyRedirectedCacheableResponsesPlugin&&(n===Z.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);0===t?this.plugins.push(Z.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}Z.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},Z.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await g(e):e};class ee{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new Z({cacheName:i(e),plugins:[...t,new Y({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const n of e){"string"===typeof n?s.push(n):n&&void 0===n.revision&&s.push(n.url);const{cacheKey:e,url:a}=z(n),r="string"!==typeof n&&n.revision?"reload":"default";if(this._urlsToCacheKeys.has(a)&&this._urlsToCacheKeys.get(a)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(a),secondEntry:e});if("string"!==typeof n&&n.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==n.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:a});this._cacheKeysToIntegrities.set(e,n.integrity)}if(this._urlsToCacheKeys.set(a,e),this._urlsToCacheModes.set(a,r),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return p(e,(async()=>{const t=new X;this.strategy.plugins.push(t);for(const[a,r]of this._urlsToCacheKeys){const t=this._cacheKeysToIntegrities.get(r),s=this._urlsToCacheModes.get(a),n=new Request(a,{integrity:t,cache:s,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:r},request:n,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{updatedURLs:s,notUpdatedURLs:n}}))}activate(e){return p(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const a of t)s.has(a.url)||(await e.delete(a),n.push(a.url));return{deletedURLs:n}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}let te;const se=()=>(te||(te=new ee),te);class ne extends F{constructor(e,t){super((({request:s})=>{const n=e.getURLsToCacheKeys();for(const e of function*(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:n=!0,urlManipulation:a}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(a){const e=a({url:r});for(const t of e)yield t.href}}(s.url,t)){const t=n.get(e);if(t)return{cacheKey:t}}}),e.strategy)}}function ae(e){return se().matchPrecache(e)}self.skipWaiting(),self.addEventListener("activate",(()=>self.clients.claim()));var re,ie,ce=[{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/8BLCnXTH6t_O6ssXQFpA5/_buildManifest.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/8BLCnXTH6t_O6ssXQFpA5/_ssgManifest.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/1a48c3c1-eb069d5513b09e5d97bc.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/1bfc9850-bf83c7cfedbb7348ab33.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/375.b268276b51717ad59bbc.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/486-07859a8a02bbbcffd034.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/780-94322d39169cf86dee47.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/78e521c3-e01ca0104c4281cd978e.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/810-6a29febf9995fee3f456.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/95b64a6e-1e17173ed3533d7e789f.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/d0447323-4c636ffcee1b24a5acfe.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/d7eeaac4-d1def6b0fb222e614bcf.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/framework-895f067827ebe11ffe45.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/main-2b170ef38cbdaa61e123.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/pages/404-7aa0ab672d86efa230ad.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/pages/_app-eb7284540b2ff69ddd77.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/pages/_error-737a04e9a0da63c9d162.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/pages/index-a16fe2ec58c5325e2931.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/polyfills-a40ef1678bae11e696dba45124eadd70.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/chunks/webpack-9e7bc6f4c98861eb7007.js'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/projects/forkify-min.5da3aea704036e7ec783ed4d4356cf96.webp'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/projects/zomify-colors-min.d23cce717be9281b1729e438e207cf41.webp'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/projects/zomy-min.0d82c68d4f45f5821ffde8740d3ffaba.webp'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/projects/zomyfile-min.c948a576ebb7dc2bffad91eeb93bef18.webp'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/zoms-square.8f4538582de8f67c922b98d01e0d2de5.jpg'},{'revision':'8BLCnXTH6t_O6ssXQFpA5','url':'/_next/static/image/src/assets/images/zoms.f91f874fe71fe58b48dd0ffcade32671.jpg'},{'revision':'3bcaf03fe3928ed2b77145ef3ff764a9','url':'/assets/resume.pdf'},{'revision':'a73cb0b17937969dc286e89fa60b13d4','url':'/assets/resume.png'},{'revision':'0ca2e32b54284f7aacca3210ba4309ca','url':'/assets/resume_compressed.pdf'},{'revision':'9651ac50256e0fd91c2cb608f4878ed7','url':'/browserconfig.xml'},{'revision':'31f189359d052d36da8c537fba4709d9','url':'/favicon.ico'},{'revision':'9412a158dfc0109e0d39b4bcc2bbf144','url':'/icons/android-chrome-512x512.png'},{'revision':'555d643cbe8e2f528c36637b5772cd8f','url':'/icons/android-icon-144x144.png'},{'revision':'d2eb4b4a7525cf58135b22c3bc883d2a','url':'/icons/android-icon-192x192.png'},{'revision':'cec1ebae896f638fd7e46fe517f69ab3','url':'/icons/android-icon-36x36.png'},{'revision':'23574ebc62f68d4d808a9f933297240e','url':'/icons/android-icon-48x48.png'},{'revision':'05343fe22d5b5cf172d4bac5ac1abfb8','url':'/icons/android-icon-72x72.png'},{'revision':'69e2e5fe69122a9a3d035165d0da033b','url':'/icons/android-icon-96x96.png'},{'revision':'c4da88ba5b72044bd0ba01eaa2ec247a','url':'/icons/apple-icon-114x114.png'},{'revision':'4784e6cbc011f0233b5023ab34ac1e5a','url':'/icons/apple-icon-120x120.png'},{'revision':'722229232d83930b0f8bb6d3cbcb33ef','url':'/icons/apple-icon-144x144.png'},{'revision':'41c8d7d7c5d27d4ea714890a5a7d4302','url':'/icons/apple-icon-152x152.png'},{'revision':'2f7196092a13343b1bd41a553247227f','url':'/icons/apple-icon-180x180.png'},{'revision':'ed6e19b978605c8384432034c6154839','url':'/icons/apple-icon-57x57.png'},{'revision':'5854b7eb1790c90aa525e2370435090c','url':'/icons/apple-icon-60x60.png'},{'revision':'8ab15318be685d0f0b4a94fd7a8a3e0e','url':'/icons/apple-icon-72x72.png'},{'revision':'97e7bfbb8827197189f32d18510d8a5d','url':'/icons/apple-icon-76x76.png'},{'revision':'43afcf70b1f682a8551d217bad1da1ac','url':'/icons/apple-icon-precomposed.png'},{'revision':'b6404e916022d3385dff30c0723c36d5','url':'/icons/apple-icon.png'},{'revision':'d223dd9c6844d4364ae359cb4f67c95e','url':'/icons/favicon-16x16.png'},{'revision':'bb2dc7cd20cfb385bd0f7a13c95e2b63','url':'/icons/favicon-32x32.png'},{'revision':'e5cec928f26654466526cb9f4db3fcdd','url':'/icons/favicon-96x96.png'},{'revision':'da523ef806f81ee149d46f5a0add3f2a','url':'/icons/mask-icon.svg'},{'revision':'001ca8185baebbc0c410acf614c4a8f2','url':'/icons/ms-icon-144x144.png'},{'revision':'909a6f066181eb738753b6b776ce3636','url':'/icons/ms-icon-150x150.png'},{'revision':'f4806bc890614a0e873a556feb9117fc','url':'/icons/ms-icon-310x310.png'},{'revision':'7b2a4f33c22f081112625a07ca8ed5e9','url':'/icons/ms-icon-70x70.png'},{'revision':'b8bdd51ff85dcb9da7cfa46f27fb68b0','url':'/robots.txt'},{'revision':'9662f0577ecf27508122388a9cdd6adc','url':'/site.webmanifest'}];ce.push({url:"/fallback",revision:"1234567890"}),function(e){se().precache(e)}(ce),function(e){const t=se();J(new ne(t,e))}(re),self.addEventListener("activate",(e=>{const t=i();e.waitUntil((async(e,t="-precache-")=>{const s=(await self.caches.keys()).filter((s=>s.includes(t)&&s.includes(self.registration.scope)&&s!==e));return await Promise.all(s.map((e=>self.caches.delete(e)))),s})(t).then((e=>{})))})),J("/",new j({cacheName:"start-url",plugins:[new M({maxEntries:1,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,new class extends K{async _handle(e,s){let n,a=await s.cacheMatch(e);if(a)0;else{0;try{a=await s.fetchAndCachePut(e)}catch(r){r instanceof Error&&(n=r)}0}if(!a)throw new t("no-response",{url:e.url,error:n});return a}}({cacheName:"google-fonts",plugins:[new M({maxEntries:4,maxAgeSeconds:31536e3,purgeOnQuotaError:!0})]}),"GET"),J(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new B({cacheName:"static-font-assets",plugins:[new M({maxEntries:4,maxAgeSeconds:604800,purgeOnQuotaError:!0})]}),"GET"),J(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new class extends K{constructor(e={}){super(e),this._networkTimeoutSeconds=e.networkTimeoutSeconds||0}async _handle(e,s){let n,a;try{const t=[s.fetch(e)];if(this._networkTimeoutSeconds){const e=f(1e3*this._networkTimeoutSeconds);t.push(e)}if(a=await Promise.race(t),!a)throw new Error(`Timed out the network response after ${this._networkTimeoutSeconds} seconds.`)}catch(r){r instanceof Error&&(n=r)}if(!a)throw new t("no-response",{url:e.url,error:n});return a}}({cacheName:"static-image-assets",plugins:[new M({maxEntries:64,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/\.(?:js)$/i,new B({cacheName:"static-js-assets",plugins:[new M({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/\.(?:css|less)$/i,new B({cacheName:"static-style-assets",plugins:[new M({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/\.(?:json|xml|csv)$/i,new j({cacheName:"static-data-assets",plugins:[new M({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/\/api\/.*$/i,new j({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new M({maxEntries:16,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),J(/.*/i,new j({cacheName:"others",networkTimeoutSeconds:10,plugins:[new M({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),ie=new B,V().setDefaultHandler(ie),function(e){V().setCatchHandler(e)}((function(e){switch(e.event.request.destination){case"document":return ae("/fallback");case"image":return ae("/static/images/fallback.png");case"font":default:return Response.error()}}))}()}();
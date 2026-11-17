// Safe release gate: never print credentials or backend response bodies.
const raw=process.env.CAFE_GAME_SERVER_URL;if(!raw)throw Error('CAFE_GAME_SERVER_URL is required; secure backend not configured');
const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Use an HTTPS backend origin');
const response=await fetch(new URL('/health',url),{signal:AbortSignal.timeout(10000)});
const value=await response.json();if(!response.ok||!value.ready||value.schema!=='authoritative-economy-v1'||!['Sandbox','Production'].includes(value.environment))throw Error('Secure backend migration/Apple configuration not ready');
console.log('Secure backend preflight passed ('+value.environment+'). Device/Apple sales gates still require manual signoff.');

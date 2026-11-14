import fs from 'node:fs';
const p='offline-runtime.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(" const persist=()=>storage.setItem(KEY,JSON.stringify(s));",` const persist=()=>{storage.setItem(KEY,JSON.stringify(s));if(!global.__CAFE_TEST_NODE__)global.dispatchEvent?.(new Event('cafeverse-local-save'));};
 const exportSave=()=>structuredClone(s);
 const importSave=(candidate)=>{
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||!Number.isSafeInteger(candidate.version)||candidate.version<0||!Number.isSafeInteger(candidate.coins)||candidate.coins<0||!Number.isSafeInteger(candidate.served)||candidate.served<0||!Array.isArray(candidate.wardrobe)||!Array.isArray(candidate.owned)||!Array.isArray(candidate.preparations)||!candidate.receipts||typeof candidate.receipts!=='object'||Array.isArray(candidate.receipts))throw Error('Bulut kaydı geçersiz.');
  const before=s;s=structuredClone(candidate);try{persist()}catch(e){s=before;throw e}return snapshot();
 };`);
s=s.replace('return {handle,snapshot};','return {handle,snapshot,exportSave,importSave};');
s=s.replace('const engine=createOfflineCafe(global.localStorage);',`const engine=createOfflineCafe(global.localStorage);
global.CafeCloudEngine=engine;`);
fs.writeFileSync(p,s);
const b='tools/build.mjs';s=fs.readFileSync(b,'utf8');s=s.replace("const prefix=script('globalThis.CafeTestCatalog='", "const prefix=script('globalThis.CafeTestCatalog='");
s=s.replace("const patch=script(`const deviceRender",`const cloudScript=script(fs.readFileSync(path.join(root,'source/public/cloud-sync.js'),'utf8'));
html=html.replace('</html>',cloudScript+'</html>');
const patch=script(\`const deviceRender`);
fs.writeFileSync(b,s);

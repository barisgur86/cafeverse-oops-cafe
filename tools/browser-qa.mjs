import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const {chromium}=await import('/Users/barisgur/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),web=path.join(root,'iOS/App/Web'),out=path.resolve(root,process.env.CAFE_QA_OUT||'../../outputs/qa-2026-11-19');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.m4a':'audio/mp4'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(web,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(web+path.sep)){res.writeHead(403).end();return;}try{const bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;let browser;const results=[];
try{
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,chromiumSandbox:true});
 for(const [label,width,height,locale] of [['iphone-se',375,667,'tr-TR'],['iphone',393,852,'en-US'],['ipad',820,1180,'tr-TR']]){
  const context=await browser.newContext({viewport:{width,height},locale});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{globalThis.__qaGains=[];const Original=window.AudioContext;window.AudioContext=class extends Original{createGain(){const node=super.createGain();globalThis.__qaGains.push(node);return node;}};});
  await page.goto(base);await page.waitForFunction(()=>typeof connected!=='undefined'&&connected);await page.locator('#living-cafe').waitFor({state:'visible'});await page.screenshot({path:path.join(out,label+'-cafe.png')});
  await page.locator('[data-act="call"]').click();
  for(let tap=0;tap<3;tap++)await page.locator('#door-call').click();
  await page.locator('.sim-door-success').waitFor({state:'visible'});
  assert.equal(await page.locator('.sim-door-count').count(),1);assert.equal(await page.locator('#door-call').count(),0);
  assert.ok(await page.locator('#door-enter.iso-primary').isVisible());
  const overflow=await page.locator('.sim-door-bubble,.sim-door-hud,.sim-door-count,.sim-door-success,#door-enter').evaluateAll(els=>els.filter(e=>{const r=e.getBoundingClientRect();return r.x<0||r.y<0||r.right>innerWidth+1||r.bottom>innerHeight+1}).map(e=>e.className));assert.deepEqual(overflow,[]);
  await page.screenshot({path:path.join(out,label+'-welcome-complete.png')});
  await page.locator('#door-enter').click();assert.ok(await page.locator('[data-person]').count()>=4);
  await page.reload();await page.waitForFunction(()=>typeof connected!=='undefined'&&connected);assert.ok(await page.locator('[data-person]').count()>=4);
  await page.locator('[data-act="menu"]').click();const sound=page.getByRole('button',{name:/Ses ayarları|Audio settings/});await sound.click();
  for(const value of [100,50,10,0]){await page.locator('#audio-music').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);assert.equal(await page.evaluate(()=>CafeAudio.settings.music),value/100);assert.equal(await page.evaluate(()=>__qaGains[1].gain.value),Math.fround(value/100));}
  await page.locator('#audio-effects').evaluate(el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#audio-master').evaluate(el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.ok(Math.abs(await page.evaluate(()=>CafeAudio.effectsGain)-.2)<.0001);
  await page.locator('#audio-mute').click();assert.equal(await page.evaluate(()=>CafeAudio.settings.muted),true);assert.equal(await page.evaluate(()=>__qaGains[0].gain.value),0);await page.locator('#audio-mute').click();assert.equal(await page.evaluate(()=>CafeAudio.settings.master),.4);
  await page.screenshot({path:path.join(out,label+'-audio.png')});for(const el of await page.locator('.audio-settings button,.audio-settings input').all()){const r=await el.boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'Audio controls must fit '+label);}
  await page.locator('#audio-close').click();
  for(const tab of ['outfit','decor','upgrades','recipes','quests']){await page.evaluate(()=>navigateGame('menu'));const button=page.locator('[data-destination="'+tab+'"]');await button.click();assert.equal(await page.evaluate(()=>tab),tab);await page.screenshot({path:path.join(out,label+'-'+tab+'.png')});}
  assert.deepEqual(errors,[]);results.push({case:label,status:'PASS',checks:['startup','locale','audio_gain_controls','mute_restore','audio_layout','menu_open_smoke'],note:'Browser automation, not physical iPhone/iPad audio.'});
  const rms=await page.evaluate(async()=>{const result=[];for(const v of [1,.5,.1,0]){const ctx=new OfflineAudioContext(1,4800,48000),osc=ctx.createOscillator(),gain=ctx.createGain();gain.gain.value=v;osc.connect(gain);gain.connect(ctx.destination);osc.start();const buffer=await ctx.startRendering();let sum=0;for(const n of buffer.getChannelData(0))sum+=n*n;result.push(Math.sqrt(sum/4800));}return result;});assert.ok(Math.abs(rms[1]/rms[0]-.5)<.001);assert.ok(Math.abs(rms[2]/rms[0]-.1)<.001);assert.equal(rms[3],0);results.push({case:label+'-rendered-webaudio',status:'PASS',rms,note:'Real OfflineAudioContext PCM gain; no speaker/hardware claim.'});await context.close();
 }
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({results,physicalDevice:'NOT RUN'},null,2));console.log('PASS browser QA:',results.length,'groups; screenshots and evidence in',out);
}catch(e){fs.writeFileSync(path.join(out,'browser-error.txt'),e.stack||String(e));throw e;}finally{await browser?.close();server.close();}

// Only project URL + PUBLIC publishable key belong in the app. Never a service-role key.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const url=new URL(input.url);
if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error('Use the HTTPS project origin.');
const key=input.publishableKey;
let publicKey=typeof key==='string'&&key.startsWith('sb_publishable_');
if(typeof key==='string'&&key.split('.').length===3){try{publicKey=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='anon'}catch{}}
if(!publicKey)throw Error('Only a publishable key or legacy anon key is allowed.');
const plist=fileURLToPath(new URL('../iOS/App/Info.plist',import.meta.url));
for(const [name,value] of [['CafeAuthURL',url.origin],['CafeAuthPublishableKey',key]]){
 try{execFileSync('/usr/libexec/PlistBuddy',['-c',`Delete :${name}`,plist],{stdio:'ignore'})}catch{}
 // JSON import avoids interpolating key data as a PlistBuddy command.
 const data=JSON.parse(execFileSync('/usr/bin/plutil',['-convert','json','-o','-',plist],{encoding:'utf8'}));data[name]=value;
 const tmp=plist+'.json';fs.writeFileSync(tmp,JSON.stringify(data));
 execFileSync('/usr/bin/plutil',['-convert','xml1','-o',plist,tmp]);fs.unlinkSync(tmp);
}
console.log('Public auth configuration installed. No server secrets copied.');

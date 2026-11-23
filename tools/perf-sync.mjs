import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import vm from 'node:vm';
export async function profileSync(source,hidden=false){let calls=0,renders=0,release;const held=new Promise(r=>release=r);const s=source.slice(source.indexOf('async function syncOnline()'),source.indexOf('async function onlineAction'));const c={connected:true,netBusy:false,doorRound:null,tab:'cafe',state:{},editingForm:()=>false,$:()=>({open:false,textContent:''}),document:{hidden,querySelector:()=>null},api:async()=>{calls++;await held;return {state:{},preparations:[]}},hydrate(){},restoreReady(){},render(){renders++}};vm.createContext(c);vm.runInContext('let syncOnlineFlight=null;'+s,c);const tasks=Array.from({length:100},()=>c.syncOnline());release();await Promise.all(tasks);return {calls,renders,scope:'100 concurrent read-only sync calls; stub network, no latency/FPS claim'};}
if(process.argv[1]===fileURLToPath(import.meta.url)){
const source=fs.readFileSync(process.env.CAFE_PERF_SYNC_SOURCE||new URL('../source/public/online.js',import.meta.url),'utf8');const report={visible:await profileSync(source),hidden:await profileSync(source,true)};fs.writeFileSync(process.env.CAFE_PERF_SYNC_OUT||'../../outputs/performance/sync-current.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));

}

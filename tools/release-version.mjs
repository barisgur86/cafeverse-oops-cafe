import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
export function validateRelease(release,history){
 if(!/^\d+\.\d+\.\d+$/.test(release.version)||!/^\d{1,18}$/.test(release.build)||!release.label)throw Error('Invalid release identity');
 if(history.some(r=>BigInt(r.build)>=BigInt(release.build)))throw Error('Build is already published or not greater than published history');
}
export function checkRelease({write=false}={}){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
 const r=JSON.parse(read('release.json')),history=JSON.parse(read('released-builds.json'));validateRelease(r,history);
 const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),file='iOS/Cafeverse.xcodeproj/project.pbxproj';let project=read(file);
 if(write){pkg.version=r.version;pkg.cafeverseReleaseLabel=r.label;lock.version=r.version;lock.packages[''].version=r.version;project=project.replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${r.version};`).replace(/CURRENT_PROJECT_VERSION = \d+;/g,`CURRENT_PROJECT_VERSION = ${r.build};`);for(const [f,data] of [['package.json',JSON.stringify(pkg,null,2)+'\n'],['package-lock.json',JSON.stringify(lock,null,2)+'\n'],[file,project]])fs.writeFileSync(path.join(root,f),data);}
 if(pkg.version!==r.version||pkg.cafeverseReleaseLabel!==r.label||lock.version!==r.version||lock.packages[''].version!==r.version)throw Error('Package identity differs from release.json; run npm run version:sync');
 for(const [key,value] of [['MARKETING_VERSION',r.version],['CURRENT_PROJECT_VERSION',r.build]]){const values=[...project.matchAll(new RegExp(key+' = ([^;]+);','g'))].map(m=>m[1]);if(values.length!==2||values.some(v=>v!==value))throw Error('Xcode identity mismatch: '+key);}
 try{execFileSync('git',['show-ref','--verify','--quiet','refs/tags/build/'+r.build],{cwd:root});throw Error('Build tag already exists');}catch(e){if(e.status!==1)throw e;}
 return r;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=checkRelease({write:process.argv.includes('--write')});console.log('PASS release configuration',r.version,r.build);}

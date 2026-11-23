// Recompress generated PNGs without changing pixels, filtered data or metadata.
import {inflateSync,deflateSync,crc32} from 'node:zlib';
import fs from 'node:fs';import path from 'node:path';
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
export function recompressPNG(input){
 if(!input.subarray(0,8).equals(signature))return input;
 const chunks=[];let offset=8,ended=false;
 while(offset<input.length){if(offset+12>input.length)throw Error('Truncated PNG');const size=input.readUInt32BE(offset),end=offset+size+12;if(end>input.length)throw Error('Truncated PNG chunk');const type=input.toString('ascii',offset+4,offset+8),chunk=input.subarray(offset,end);if(crc32(chunk.subarray(4,-4))!==chunk.readUInt32BE(chunk.length-4))throw Error('Invalid PNG CRC');chunks.push({type,chunk,data:chunk.subarray(8,-4)});offset=end;if(type==='IEND'){ended=true;break}}
 if(!ended||offset!==input.length)throw Error('Invalid PNG end');
 if(chunks.some(c=>c.type==='acTL'))return input;
 const idats=chunks.filter(c=>c.type==='IDAT');if(!idats.length)throw Error('Missing PNG image');
 const raw=inflateSync(Buffer.concat(idats.map(c=>c.data))),compressed=deflateSync(raw,{level:9});
 if(!inflateSync(compressed).equals(raw))throw Error('PNG lossless verification failed');
 const replacement=Buffer.alloc(compressed.length+12);replacement.writeUInt32BE(compressed.length);replacement.write('IDAT',4);compressed.copy(replacement,8);replacement.writeUInt32BE(crc32(replacement.subarray(4,-4)),replacement.length-4);
 let inserted=false;const result=Buffer.concat([signature,...chunks.flatMap(c=>c.type!=='IDAT'?[c.chunk]:inserted?[]:(inserted=true,[replacement]))]);return result.length<input.length?result:input;
}
export function optimizeGeneratedPNGs(directory){let before=0,after=0,count=0;for(const name of fs.readdirSync(directory)){const file=path.join(directory,name);if(fs.statSync(file).isDirectory()){const r=optimizeGeneratedPNGs(file);before+=r.before;after+=r.after;count+=r.count}else if(name.endsWith('.png')){const bytes=fs.readFileSync(file),out=recompressPNG(bytes);before+=bytes.length;after+=out.length;if(out.length<bytes.length){fs.writeFileSync(file,out);count++}}}return {before,after,count};}

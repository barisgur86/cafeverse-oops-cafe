import assert from 'node:assert/strict';import {validateRelease,checkRelease} from '../tools/release-version.mjs';
const r=checkRelease();validateRelease(r,[]);for(const build of [r.build,String(BigInt(r.build)+1n)])assert.throws(()=>validateRelease(r,[{build}]),/published/);assert.throws(()=>validateRelease({...r,version:'0.9.9.1'},[]),/identity/);console.log('PASS version guard: central identity and duplicate/non-increasing published build rejection.');

validateRelease({version:"0.9.15",build:"15",label:"Cafeverse 0.9.15"},[{version:"0.9.11",build:"2026112302"}]);assert.throws(()=>validateRelease({version:"0.9.15",build:"15",label:"x"},[{version:"0.9.15",build:"15"}]),/published/);

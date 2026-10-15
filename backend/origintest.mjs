import { spawn } from 'node:child_process'; 
const s = spawn(process.execPath, ['src/server.js'], { cwd: 'zero-to-shipped/backend' }); 
s.stdout.on('data', function(d){ process.stdout.write('S ' + d); }); 
s.stderr.on('data', function(d){ process.stdout.write('E ' + d); }); 
const wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
async function main(){ 
await wait(8000); 
const r1 = await fetch('http://localhost:5000/api/health', { headers: { Origin: 'https://zero-to-shipped.vercel.app' } }); 
console.log('CROSS-ORIGIN-GET', r1.status, await r1.text()); 
const r2 = await fetch('http://localhost:5000/api/health'); 
console.log('NO-ORIGIN-GET', r2.status, await r2.text()); 
const r3 = await fetch('http://localhost:5000/api/analyze', { method: 'POST', headers: { Origin: 'https://zero-to-shipped.vercel.app' }, body: (function(){ const f = new FormData(); f.append('jobDescription','too short'); return f; })() }); 
console.log('CROSS-ORIGIN-POST', r3.status, await r3.text()); 
s.kill(); process.exit(0); } 
main(); 

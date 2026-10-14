import { spawn } from 'node:child_process'; 
const s = spawn(process.execPath, ['src/server.js'], { cwd: 'zero-to-shipped/backend' }); 
s.stdout.on('data', function(d){ process.stdout.write('S ' + d); }); 
s.stderr.on('data', function(d){ process.stdout.write('E ' + d); }); 
const wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }; 
const LT = String.fromCharCode(60), GT = String.fromCharCode(62), PCT = String.fromCharCode(37); 
function makePdf(){ 
const t = 'BT /F1 18 Tf 72 700 Td (React TypeScript JavaScript HTML CSS REST API Testing Git Docker AWS Postgres) Tj ET'; 
const o = [];
o[1] = '1 0 obj\n' + LT + LT + ' /Type /Catalog /Pages 2 0 R ' + GT + GT + '\nendobj\n'; 
o[2] = '2 0 obj\n' + LT + LT + ' /Type /Pages /Kids [3 0 R] /Count 1 ' + GT + GT + '\nendobj\n'; 
o[3] = '3 0 obj\n' + LT + LT + ' /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources ' + LT + LT + ' /Font ' + LT + LT + ' /F1 4 0 R ' + GT + GT + ' ' + GT + GT + ' /Contents 5 0 R ' + GT + GT + '\nendobj\n'; 
o[4] = '4 0 obj\n' + LT + LT + ' /Type /Font /Subtype /Type1 /BaseFont /Helvetica ' + GT + GT + '\nendobj\n'; 
o[5] = '5 0 obj\n' + LT + LT + ' /Length ' + t.length + ' ' + GT + GT + '\nstream\n' + t + '\nendstream\nendobj\n';
let p = PCT + 'PDF-1.4\n'; 
const off = [0]; 
for (let i = 1; i !== 6; i++) { off[i] = p.length; p += o[i]; } 
const x = p.length; 
p += 'xref\n0 6\n0000000000 65535 f \n'; 
for (let i = 1; i !== 6; i++) { p += String(off[i]).padStart(10, '0') + ' 00000 n \n'; } 
p += 'trailer\n' + LT + LT + ' /Size 6 /Root 1 0 R ' + GT + GT + '\nstartxref\n' + x + '\n' + PCT + PCT + 'EOF\n'; 
return Buffer.from(p, 'latin1'); 
}
async function main(){ 
await wait(9000); 
const h = await fetch('http://localhost:5000/api/health'); 
console.log('HEALTH', h.status, await h.text()); 
const nf = await fetch('http://localhost:5000/api/nope'); 
console.log('NOTFOUND', nf.status, await nf.text()); 
const fd = new FormData(); 
fd.append('resume', new Blob([makePdf()], { type: 'application/pdf' }), 'resume.pdf'); 
fd.append('jobDescription', 'We need React, TypeScript, JavaScript, HTML and CSS, REST APIs, Testing, Git. Nice to have: Docker, AWS, GraphQL, Kubernetes, CI/CD.'); 
const r = await fetch('http://localhost:5000/api/analyze', { method: 'POST', body: fd }); 
console.log('ANALYZE', r.status, await r.text());
const fd2 = new FormData(); 
fd2.append('jobDescription', 'too short'); 
const r2 = await fetch('http://localhost:5000/api/analyze', { method: 'POST', body: fd2 }); 
console.log('NOFILE', r2.status, await r2.text()); 
const fd3 = new FormData(); 
fd3.append('resume', new Blob([Buffer.from('not a pdf')], { type: 'text/plain' }), 'notes.txt'); 
fd3.append('jobDescription', 'We need React, TypeScript, JavaScript, HTML and CSS, REST APIs, Testing, Git, Docker and AWS.'); 
const r3 = await fetch('http://localhost:5000/api/analyze', { method: 'POST', body: fd3 }); 
console.log('NOTPDF', r3.status, await r3.text()); 
s.kill(); 
process.exit(0); 
} 
main(); 

import {mkdir,writeFile} from 'node:fs/promises';
const fonts=[
 ['barlow-600.ttf','https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873_3E.ttf'],
 ['barlow-700.ttf','https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2_3E.ttf'],
 ['dm-400.ttf','https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf'],
 ['dm-500.ttf','https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf'],
 ['dm-600.ttf','https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAfJthTg.ttf'],
 ['dm-700.ttf','https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf'],
 ['Barlow-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt'],
 ['DM-Sans-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt']
];
await mkdir('public/fonts',{recursive:true});
await Promise.all(fonts.map(async([name,url])=>{const r=await fetch(url);if(!r.ok)throw new Error(`Font download failed: ${name}`);await writeFile('public/fonts/'+name,new Uint8Array(await r.arrayBuffer()));}));
console.log('Local fonts and their OFL licenses saved.');

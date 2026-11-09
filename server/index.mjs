import { createApp } from './app.mjs';
import express from 'express';
import { resolve } from 'node:path';
try { process.loadEnvFile(); } catch(e) { if(e.code!=='ENOENT')throw e; }
const production=process.argv.includes('--production');
const {app}=createApp({production,dbPath:process.env.DATABASE_PATH||'data/feed7.sqlite'});
if(production){app.use(express.static(resolve('dist')));app.get('/{*path}',(req,res)=>res.sendFile(resolve('dist/index.html')));}
else {const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
const port=Number(process.env.PORT)||5173;
app.listen(port,'0.0.0.0',()=>console.log(`FEED7 studio ready: http://localhost:${port}`));

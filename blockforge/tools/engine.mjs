import {resolve,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

export const ENGINE=resolve(process.env.BLOCKFORGE_ROOT||'D:/dev/block game');
export const engineImport=file=>import(pathToFileURL(join(ENGINE,file)).href);
export const projectRoot=fileURLToPath(new URL('..',import.meta.url));

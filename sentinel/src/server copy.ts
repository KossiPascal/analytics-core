// import * as fs from 'fs';
// import * as path from 'path';
// import * as crypto from 'crypto';
// import { exec } from 'child_process';
// import workbox from 'workbox-build';
// import WebSocket from 'ws';

// // Create WebSocket client
// const wss = new WebSocket.Server({ port: 8000 });


// const projectDir = path.dirname(path.dirname(__dirname));
// const buildDir = path.join(projectDir, 'api', 'build', 'browser');
// const staticDirectoryPath = path.join(buildDir, 'assets');
// const serviceWorkerFile = path.join(buildDir, 'ngsw.json');


// let previousServiceWorkerHash: string | null = null;


// const fsExists = (path: string) => new Promise((resolve) => {
//   fs.access(path, (err) => resolve(!err));
// });

// // Function to compare hashes
// const hasServiceWorkerChanged = (): boolean => {
//   try {
//     if (fs.existsSync(serviceWorkerFile)) {
//       const currentHash = calculateFileHash(serviceWorkerFile);
//       if (currentHash !== previousServiceWorkerHash) {
//         previousServiceWorkerHash = currentHash;
//         return true;
//       }
//     }
//   } catch (err) {
//     console.error('Error reading service worker file:', err);
//   }
//   return false;
// };

// // Function to calculate hash of a file
// const calculateFileHash = (filePath: string): string => {
//   const fileContent = fs.readFileSync(filePath);
//   return crypto.createHash('md5').update(fileContent).digest("hex");
// };

// const getServiceWorkerHash = async () => {
//   if (!await fsExists(serviceWorkerFile)) {
//     return;
//   }

//   return new Promise((resolve) => {
//     try {
//       const hash = crypto.createHash('sha1');
//       const stream = fs.createReadStream(serviceWorkerFile);
//       stream.setEncoding('utf8');
//       stream.on('data', (data) => {
//         hash.update(data)
//       });
//       stream.on('end', () => {
//         resolve(hash.digest('hex'))
//       });
//       stream.on('error', (err) => {
//         console.error('Error while reading service worker: %o', err);
//         resolve(err);
//       });
//     } catch (err) {
//       console.error('Error while generating service worker hash: %o', err);
//       resolve(err);
//     }
//   });
// };

// // Function to watch for changes in the build directory
// const watchBuildDirectory = (): void => {
//   try {
//     fs.watch(buildDir, (event, filename) => {
//       if (filename === 'ngsw.json' && hasServiceWorkerChanged()) {
//         // Reload the Angular application
//         reloadApplication(filename);
//       }
//     });
//   } catch (error) {
//     console.log('Error watching build directory, retrying ...');
//   }
// };

// const appendExtensionLibs = async (config: any) => {
//   // const libs = await extensionLibs.getAll();
//   // // cache this even if there are no libs so offline client knows there are no libs
//   // libs.forEach((lib:any) => {
//   //   const libPath = path.join('/extension-libs', lib.name);
//   //   config.globPatterns.push(libPath);
//   //   config.templatedURLs[libPath] = lib.data;
//   // });
// };

// // Use the workbox library to generate a service-worker script
// const writeServiceWorkerFile = async () => {
//   const config = {
//     cacheId: 'cht',
//     clientsClaim: true,
//     skipWaiting: true,
//     cleanupOutdatedCaches: true,
//     swDest: serviceWorkerFile,
//     globDirectory: staticDirectoryPath,
//     maximumFileSizeToCacheInBytes: 1048576 * 30,
//     globPatterns: [
//       `!ngsw.json`, // exclude service worker path

//       // webapp
//       'manifest.json',
//       './*',
//     ],
//     templatedURLs: {
//       '/': ['index.html'], // Webapp's entry point
//     },
//     ignoreURLParametersMatching: [/redirect/, /username/],
//     modifyURLPrefix: {
//       'webapp/': '/',
//     },
//   };
//   await appendExtensionLibs(config);
//   await workbox.generateSW(config);
// };

// watchBuildDirectory();
// // setInterval(watchBuildDirectory, 5000);


// wss.on('connection', ws => {
//   console.log('WebSocket client connected');

//   ws.on('message', message => {
//     console.log(`Received message from client: ${message}`);
//     if (message.toLocaleString() === 'reload') {
//       // Send reload message to all clients
//       // wss.clients.forEach(client => {
//       //   if (client.readyState === WebSocket.OPEN) {
//       //     client.send(JSON.stringify({ type: 'reload' })); // Send as JSON
//       //   }
//       // });
//     }
//   });
// });

// const reloadApplication = (filename: string): void => {
//   // Command to reload the Angular application (adjust this based on your setup)
//   // exec('npm run reload', (error, stdout, stderr) => {
//   //     if (error) {
//   //         console.error(`Error reloading application: ${error}`);
//   //         return;
//   //     }
//   //     console.log(`Application reloaded successfully`);
//   // });

//   // Send reload message to Angular app
//   wss.clients.forEach(client => {
//     if (client.readyState === WebSocket.OPEN) {
//       setTimeout(() => {
//         client.send(JSON.stringify({ type: 'reload' })); // Send as JSON
//         console.log(`Application wanting for reload`);
//       }, 1000);

//     }
//   });
// };


// console.log('Sentinel watching for changes...');
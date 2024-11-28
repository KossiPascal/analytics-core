import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const projectDir = path.dirname(path.dirname(__dirname));
const buildDir = path.join(projectDir, 'views');
const serviceWorkerFile = path.join(buildDir, 'ngsw.json');

var change:number = 0;


let previousServiceWorkerHash: string | null = null;

// Function to compare hashes
const hasServiceWorkerChanged = (): boolean => {
  try {
    if (fs.existsSync(serviceWorkerFile)) {
      const currentHash = calculateFileHash(serviceWorkerFile);
      if (currentHash !== previousServiceWorkerHash) {
        previousServiceWorkerHash = currentHash;
        return true;
      }
    }
  } catch (err) {
    console.error('Error reading service worker file:', err);
  }
  return false;
};

// Function to calculate hash of a file
const calculateFileHash = (filePath: string): string => {
  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileContent as any).digest("hex");
};

// Function to watch for changes in the build directory
const watchBuildDirectory = (): void => {
  try {
    fs.watch(buildDir, (event, filename) => {
      if (filename === 'ngsw.json' && hasServiceWorkerChanged()) {
        // Reload the Angular application
        reloadApplication(filename);
      }
    });
  } catch (error) {
    console.log('Error watching build directory, retrying ...');
  }
};

const reloadApplication = (filename: string): void => {
  change+=1;
  console.log(`Change ${change} is detecting ...`);
};

console.log('Sentinel watching for changes...');

watchBuildDirectory();
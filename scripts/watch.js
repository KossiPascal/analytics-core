const Gaze = require('gaze').Gaze;
const { spawn } = require('child_process');
const rootdir = __dirname + '/../';

const watchers = [];

const DEBOUNCE = 10; // 10 ms
const GAZE_OPTIONS = {
  interval: 1000 // how often the target should be polled in milliseconds
};

const configs = [

  // webapp-js
  // instead of watching the source files which are watched separately, watch the build folder and upload on rebuild
  {
    files: [
      'views/*',
      'views/**/*',
      '!views/service-worker.*',
      '!views/manifest.json',
      '!views/workbox-*'
    ],
    cmd: 'npm',
    args: [ 'run', 'update-service-worker' ]
  },
];

// debounce to make sure the task isn't run multiple times
const debounceCache = {};

const run = ({ cmd, args }) => {
  const name = `${cmd}-${args.join('-')}`;
  if (debounceCache[name]) {
    clearTimeout(debounceCache[name]);
  }
  debounceCache[name] = setTimeout(() => {
    const child = spawn(cmd, args, { cwd: rootdir });
    child.stdout.on('data', data => console.log(data.toString()));
    child.stderr.on('data', data => console.error(data.toString()));
    child.on('error', err => console.error(err));
    child.on('close', () => console.log('Update complete.\nWaiting...'));
  }, DEBOUNCE);
};

const startWatchers = () => {
  for (const config of configs) {
    const watcher = new Gaze(config.files, GAZE_OPTIONS);
    watchers.push(watcher);
    watcher.on('all', (event, filepath) => {
      console.log(`${filepath} updated...`);
      run(config);
    });
  }
};

const clearWatchers = () => {
  for (const watcher of watchers) {
    watcher.close();
  }
  watchers.length = 0;
};

const startConfigWatcher = () => {
  const watcher = new Gaze([ 'package.json' ], GAZE_OPTIONS);
  watcher.on('all', (event, filepath) => {
    console.log(`${filepath} updated...`);
    clearWatchers();
    init();
  });
};

const init = () => {
  startWatchers();
  startConfigWatcher();
  console.log('Waiting...');
};

(() => {
  init();
})();

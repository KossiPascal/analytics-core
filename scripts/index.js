
// const rpn = require('request-promise-native');

const getApiUrl = (pathname = '') => {
  return 'http://localhost:4437/';
};

const updateServiceWorker = () => {
  const updateSWUrl = getApiUrl('/api/upgrade/service-worker');

  // return rpn.get(updateSWUrl).catch(err => {
  //   if (err.error && err.error.code === 'ECONNREFUSED') {
  //     console.warn('API could not be reached, so the service-worker has not been updated. ');
  //     return;
  //   }

  //   throw err;
  // });
};

module.exports = {
  updateServiceWorker,
};

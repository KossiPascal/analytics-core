import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

// platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
//   if ('serviceWorker' in navigator) {
//     enableProdMode();
//     window.addEventListener('load', () => {
//       navigator.serviceWorker.register('/ngsw-worker.js')
//         .then(registration => {
//           console.log('ServiceWorker registration successful with scope: ', registration.scope);
//         })
//         .catch(err => {
//           console.log('ServiceWorker registration failed: ', err);
//         });
//     });
//   }
// }).catch(err => console.log(err));

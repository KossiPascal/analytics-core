import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


import 'hammerjs';

// // require('./assets/js/enketo/main');
// import './assets/js/moment-locales/tl';
// import './assets/js/moment-locales/hil';
// import './assets/js/moment-locales/ceb';
// import './assets/js/moment-locales/lg';

// import 'moment/locale/fr';
// import 'moment/locale/es';
// import 'moment/locale/bm';
// import 'moment/locale/hi';
// import 'moment/locale/id';
// import 'moment/locale/ne';
// import 'moment/locale/sw';
// import 'moment/locale/ar';

// import 'select2';

// import './assets/js/enketo/main';



if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

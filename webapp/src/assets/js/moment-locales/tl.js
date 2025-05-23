//! moment.js locale configuration
//! locale : Tagalog (Philippines) [tl]
//! author : Joy Kimmel : https:/github.com/joymkimmel

import moment from 'moment';
moment.defineLocale('tl', {
  months: 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split(
    '_'
  ),
  monthsShort: 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
  weekdays: 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split(
    '_'
  ),
  weekdaysShort: 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
  weekdaysMin: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'MM/D/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY HH:mm',
    LLLL: 'dddd, MMMM DD, YYYY HH:mm',
  },
  calendar: {
    sameDay: 'LT [ngayong araw]',
    nextDay: '[Bukas ng] LT',
    nextWeek: 'LT [sa susunod na] dddd',
    lastDay: 'LT [kahapon]',
    lastWeek: 'LT [noong nakaraang linggo] dddd',
    sameElse: 'L',
  },
  relativeTime: {
    future: 'sa loob ng %s',
    past: '%s ang nakalipas',
    s: 'isang segundo',
    ss: '%d segundo',
    m: 'isang minuto',
    mm: '%d minuto',
    h: 'isang oras',
    hh: '%d oras',
    d: 'isang araw',
    dd: '%d araw',
    M: 'isang buwan',
    MM: '%d buwan',
    y: 'isang taon',
    yy: '%d taon',
  },
  dayOfMonthOrdinalParse: /\d{1,2}/,
  ordinal: function (number) {
    return number;
  },
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
});

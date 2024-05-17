// export function loadScript(scriptUrl: string) {
//   document.write(`<script src="${scriptUrl}"></script>`);
// }

export const RETRY_MILLIS = 5000;

export function toArray(data: any): string[] {
  return notNull(data) ? Array.isArray(data) ? data : [data] : [];
}

export function loadScript(scriptUrl: string) {
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.type = 'text/javascript';
  document.body.appendChild(script);
}

export function getProjectPath(): string {
  // Utilisation des fonctionnalités de manipulation de chemin de TypeScript
  const fullPath = '';
  const directory = fullPath.substring(0, fullPath.lastIndexOf('/'));
  return directory;
}

export function notNull(data: any): boolean {
  return data != '' && data != null && data != undefined && typeof data != undefined && data.length != 0; // && Object.keys(data).length != 0;
}

export function isNumber(n: any): boolean {
  return /^-?[\d.]+(?:e-?\d+)?$/.test(n);
}

export function loadCss(cssUrl: string) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
}

export function getHideMainPage(): boolean {
  const s = window.location.pathname;
  const scs = s.includes('errors/') ||
    s.includes('/errors') ||
    s.includes('/errors/') ||

    s.includes('/auths/login') ||
    s.includes('/auths/login/') ||
    s.includes('auths/login/') ||
    s.includes('auths/login');
  return scs;
}

export function getMonthsList(): { labelEN: string; labelFR: string; id: string; uid: number }[] {
  return [
    { labelEN: "January", labelFR: "Janvier", id: "01", uid: 1 },
    { labelEN: "February", labelFR: "Février", id: "02", uid: 2 },
    { labelEN: "March", labelFR: "Mars", id: "03", uid: 3 },
    { labelEN: "April", labelFR: "Avril", id: "04", uid: 4 },
    { labelEN: "May", labelFR: "Mai", id: "05", uid: 5 },
    { labelEN: "June", labelFR: "Juin", id: "06", uid: 6 },
    { labelEN: "July", labelFR: "Juillet", id: "07", uid: 7 },
    { labelEN: "August", labelFR: "Août", id: "08", uid: 8 },
    { labelEN: "September", labelFR: "Septembre", id: "09", uid: 9 },
    { labelEN: "October", labelFR: "Octobre", id: "10", uid: 10 },
    { labelEN: "November", labelFR: "Novembre", id: "11", uid: 11 },
    { labelEN: "December", labelFR: "Décembre", id: "12", uid: 12 },
  ];
}

export function currentMonth(date?: string): { labelEN: string; labelFR: string; id: string; uid: number } {
  let month: number;
  try {
    month = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;
  } catch (e) {
    month = new Date().getMonth() + 1;
  }
  const mth = month < 10 ? `0${month}` : `${month}`;

  for (const m of getMonthsList()) {
    if (m.id == mth) return m;
  }
  return { labelEN: '', labelFR: '', id: '', uid: 0 };
}

export function currentMonthString(date?: string): string {
  let month: number;
  try {
    month = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;
  } catch (e) {
    month = new Date().getMonth() + 1;
  }

  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  return formattedMonth;
}

export function monthByArg(arg: any): { labelEN: string; labelFR: string; id: string; uid: number } {
  for (const m of getMonthsList()) {
    if (arg == m.labelFR || arg == m.labelEN || arg == m.id || arg == m.uid) {
      return m;
    }
  }
  return { labelEN: '', labelFR: '', id: '', uid: 0 };
}

export function TODAY_YEAR_MONTH_DAY(): { year: number, month: number, month_str: string, day: number, start_date: string, end_date: string } {
  const n = new Date();
  const year = n.getFullYear();
  const month = n.getMonth();
  const _month = String(month + 1).padStart(2, '0');
  const day = n.getDate();
  const lastDate = String((new Date(year, 0, 0)).getDate()).padStart(2, '0');
  const start_date = `${year}-${_month}-01`;
  const end_date = `${year}-${_month}-${lastDate}`;

  return { year: year, month: month + 1, month_str: _month, day: day, start_date: start_date, end_date: end_date }
}

export function getYearsList(biginYear: number = 2022): number[] {
  var cYear: number = currentYear();
  if (biginYear == cYear) return [cYear];
  if (biginYear < cYear) {
    var ys: number[] = [];
    for (var i = 0; i <= cYear - biginYear; i++) {
      ys.push(cYear - i);
    }
    return ys.sort((a, b) => a - b);
  }
  return [biginYear]
}

export function currentYear(date?: string): number {
  try {
    const formattedDate = date ? formatDate(new Date(date)) : formatDate(new Date());
    return parseInt(formattedDate, 10);
  } catch (e) {
    return parseInt(formatDate(new Date()), 10);
  }
}

function formatDate(date: Date): string {
  return date.getFullYear().toString();
}

// let accessToken: string | null = null;
// let accessTokenExp: number | null = null; // UNIX timestamp (seconds)
// let refreshAccessToken: string | null = null;
// let refreshAccessTokenExp: number | null = null;


// export const tokenProvider = {
//   set: (token: string | null, tokenExp?: number,refreshToken?: string | null, refreshTokenExp?: number) => {
//     accessToken = token;
//     accessTokenExp = tokenExp ?? null;
//     refreshAccessToken = refreshToken ?? null;
//     refreshAccessTokenExp = refreshTokenExp ?? null;
//   },
//   get: () => accessToken,
//   getRefreshToken: () => refreshAccessToken,
//   getTokenExpiration: () => accessTokenExp,
//   getRefreshTokenExpiration: () => refreshAccessTokenExp,
//   clear: () => {
//     accessToken = null;
//     accessTokenExp = null;
//     refreshAccessToken = null;
//     refreshAccessTokenExp = null;
//   },
// };
/* ============================================================================
   TOKEN PROVIDER (PURE, DUMB, RELIABLE)
   ============================================================================ */



export const tokenProvider = {
  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  },

  isAccessTokenExpired(): boolean {
    const exp = Number(localStorage.getItem("access_token_exp"));
    return !exp || Date.now() >= exp;
  },

  set(
    access: string,
    accessExp: number,
    refresh: string,
    refreshExp: number
  ) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("access_token_exp", String(accessExp));
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("refresh_token_exp", String(refreshExp));
  },

  clear() {
    localStorage.clear();
  },
};
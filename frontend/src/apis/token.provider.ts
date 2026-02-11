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
    const refreshExp = Number(localStorage.getItem("refresh_token_exp"));
    if (!exp) return true;

    const expMs = exp * 1000; // secondes → millisecondes
    const nowMs = Date.now();
    const diffMin = (expMs - nowMs) / 60000; // minutes restantes
    const refreshDiffMin = (refreshExp * 1000 - nowMs) / 60000; // minutes avant expiration du refresh token
    console.log(`[TOKEN_PROVIDER]: exp=${expMs}, now=${nowMs} | diff=${diffMin.toFixed(2)} min | refreshDiff=${refreshDiffMin.toFixed(2)} min`);
    return nowMs >= expMs;


    // const nowSec = Math.floor(Date.now() / 1000);
    // console.log(`[TOKEN_PROVIDER] Checking access token expiration: exp=${exp}, now=${nowSec}`);
    // return nowSec >= exp;
  },

  set(access: string,accessExp: number,refresh: string,refreshExp: number) {
    localStorage.setItem("access_token", access);
    localStorage.setItem("access_token_exp", String(accessExp));
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("refresh_token_exp", String(refreshExp));
  },

  clear() {
    localStorage.clear();
  },
};
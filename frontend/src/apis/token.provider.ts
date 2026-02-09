let accessToken: string | null = null;
let accessTokenExp: number | null = null; // UNIX timestamp (seconds)
let refreshAccessToken: string | null = null;
let refreshAccessTokenExp: number | null = null;


export const tokenProvider = {
  set: (token: string | null, tokenExp?: number,refreshToken?: string | null, refreshTokenExp?: number) => {
    accessToken = token;
    accessTokenExp = tokenExp ?? null;
    refreshAccessToken = refreshToken ?? null;
    refreshAccessTokenExp = refreshTokenExp ?? null;
  },
  get: () => accessToken,
  getRefreshToken: () => refreshAccessToken,
  getTokenExpiration: () => accessTokenExp,
  getRefreshTokenExpiration: () => refreshAccessTokenExp,
  clear: () => {
    accessToken = null;
    accessTokenExp = null;
    refreshAccessToken = null;
    refreshAccessTokenExp = null;
  },
};

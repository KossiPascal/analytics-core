// TOKEN PROVIDER (PURE, DUMB, RELIABLE)

export type TokenStrParam = string | null | undefined
export type TokenIntParam = number | null | undefined

// token.provider.ts
let accessToken: TokenStrParam = undefined;
let accessTokenExp: TokenIntParam = undefined;
let refreshToken: TokenStrParam = undefined;
let refreshTokenExp: TokenIntParam = undefined;

export const tokenProvider = {
  getAccessToken(): TokenStrParam{
    return accessToken;
  },

  getRefreshToken(): TokenStrParam {
    return refreshToken;
  },

  set(token: TokenStrParam, exp: TokenIntParam, newRefreshToken?: TokenStrParam, refreshExp?: TokenIntParam) {
    accessToken = token;
    accessTokenExp = exp;
    if (newRefreshToken !== undefined) refreshToken = newRefreshToken;
    if (refreshExp !== undefined) refreshTokenExp = refreshExp;
  },

  clear() {
    accessToken = null;
    accessTokenExp = null;
    refreshToken = null;
    refreshTokenExp = null;
  },

  isExpired(): boolean {
    if (!accessToken || !accessTokenExp) return true;
    const expMs = Number(accessTokenExp) * 1000; // secondes → millisecondes
    const nowMs = Date.now();

    if (refreshTokenExp) {
      const refreshExpMs = Number(refreshTokenExp) * 1000;
      const diffMin = (expMs - nowMs) / 60000; // minutes restantes
      const refreshDiffMin = (refreshExpMs - nowMs) / 60000; // minutes avant expiration du refresh token
      console.log(`[TOKEN_PROVIDER]: exp=${expMs}, now=${nowMs} | diff=${diffMin.toFixed(2)} min | refreshDiff=${refreshDiffMin.toFixed(2)} min`);
    }

    return nowMs >= expMs;
    // const nowSec = Math.floor(Date.now() / 1000);
    // console.log(`[TOKEN_PROVIDER] Checking access token expiration: exp=${exp}, now=${nowSec}`);
    // return nowSec >= exp;
  },

  /**
   * Check if token will expire soon.
   * @param bufferSeconds - seconds before expiration to consider as expiring
   */
  isExpiringSoon(bufferSeconds: number = 30): boolean {
    if (!accessToken || !accessTokenExp) return true;

    const nowMs = Date.now();
    const expMs = Number(accessTokenExp) * 1000;

    const bufferMs = bufferSeconds * 1000;

    const remainingMs = expMs - nowMs;

    // Optional debug
    // console.log(`[TOKEN] Remaining: ${(remainingMs / 1000).toFixed(1)}s`);

    return remainingMs <= bufferMs;
  },

  /**
   * Check if refresh token is still valid
   */
  isRefreshValid(): boolean {
    if (!refreshToken || !refreshTokenExp) return false;

    const expMs = Number(refreshTokenExp) * 1000;
    return Date.now() < expMs;
  }
};


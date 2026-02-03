// token.provider.ts
let accessToken: string | null = null;

export const tokenProvider = {
  set(token: string | null) {
    accessToken = token;
  },
  get() {
    return accessToken;
  },
};

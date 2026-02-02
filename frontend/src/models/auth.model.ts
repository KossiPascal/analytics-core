export interface PayloadUser {
    id: string;
    username: string;
    fullname: string;
    tenant_id: string | undefined;
    // roles: string[];
    mustChangeDefaultPassword:boolean
    permissions: string[]
}

export interface LoginResponse {
    access_token: string;
    access_token_exp: number,
    refresh_token: string;
    refresh_token_exp: number,
    payload: PayloadUser
}

export type ApiResponse<T = any> = {
    status: number;
    success: boolean;
    data?: T;
    message?: any;
    headers?: Headers | any;
};


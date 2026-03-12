export interface UserPayload {
    id: string;
    username: string;
    fullname: string;
    tenant_id: number | undefined;
    // roles: string[];
    mustChangeDefaultPassword: boolean
    permissions: string[]
    /** ID de l'employé lié à ce compte (null si admin sans fiche employé) */
    employee_id?: string | null;
    /** ID du poste hiérarchique (null si admin sans poste → voit tout) */
    position_id?: string | null;
    /** Code du département du poste (ex: LOG, ETH, TIC) */
    department_code?: string | null;
    // Organization units (optional for filtered access)
    countries?: any[];
    regions?: any[];
    prefectures?: any[];
    communes?: any[];
    hospitals?: any[];
    districtQuartiers?: any[];
    chws?: any[];
    recos?: any[];
}

export interface LoginResponse {
    payload: UserPayload
    access_token: string;
    access_token_exp: number,
    refresh_token: string;
    refresh_token_exp: number,
}

export type ApiResponse<T = any> = {
    status: number;
    success: boolean;
    data?: T;
    message?: any;
    headers?: Headers | any;
};


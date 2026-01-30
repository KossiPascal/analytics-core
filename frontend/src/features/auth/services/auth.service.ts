import { Database } from '@/utils/Database';
import type { LoginCredentials, LoginResponse, User, ChangePasswordPayload } from '@/types';
import {
  COUNTRIES,
  REGIONS,
  PREFECTURES,
  COMMUNES,
  HOSPITALS,
  DISTRICT_QUARTIERS,
  VILLAGE_SECTEURS,
  CHWS,
  RECOS,
} from '@/utils/TestData';

// Type pour l'utilisateur stocké en base
interface StoredUser {
  id: string;
  username: string;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  isActive: boolean;
  mustChangeDefaultPassword: boolean;
}

// Instance de la base de données locale
const db = new Database({ namespace: 'kendeya_auth', integrityCheck: true });

// Données utilisateurs de test
const TEST_USERS: StoredUser[] = [
  {
    id: 'user-001',
    username: 'admin',
    password: 'Admin123',
    fullname: 'Administrateur Système',
    email: 'admin@kendeya.com',
    phone: '+224 620 00 00 01',
    isActive: true,
    mustChangeDefaultPassword: false,
  },
  {
    id: 'user-002',
    username: 'user',
    password: 'user123',
    fullname: 'Utilisateur Standard',
    email: 'user@kendeya.com',
    phone: '+224 620 00 00 02',
    isActive: true,
    mustChangeDefaultPassword: true,
  },
  {
    id: 'user-003',
    username: 'docteur',
    password: 'docteur123',
    fullname: 'Dr. Jean Dupont',
    email: 'docteur@kendeya.com',
    phone: '+224 620 00 00 03',
    isActive: true,
    mustChangeDefaultPassword: false,
  },
];

// Initialise les utilisateurs de test si la collection est vide
function initTestUsers(): void {
  const existingUsers = db.count('users');
  if (existingUsers === 0) {
    db.createMany<StoredUser>('users', TEST_USERS);
    console.log('[AuthService] Utilisateurs de test initialisés:', TEST_USERS.length);
  }
}

// Génère un token JWT simulé
function generateMockToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 heure
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

// Convertit un StoredUser en User complet
function toFullUser(stored: StoredUser, token: string): User {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: stored.id,
    username: stored.username,
    fullname: stored.fullname,
    email: stored.email,
    phone: stored.phone,
    routes: [
      { path: '/reports', label: 'Rapports', authorizations: [] },
      { path: '/dashboards', label: 'Tableaux de bord', authorizations: [] },
      { path: '/admin', label: 'Administration', authorizations: ['admin'] },
    ],
    authorizations: stored.username === 'admin' ? ['admin', 'user'] : ['user'],
    exp: now + 3600,
    iat: now,
    rolesIds: stored.username === 'admin' ? [1] : [2],
    rolesNames: stored.username === 'admin' ? ['Administrateur'] : ['Utilisateur'],
    roles: [{
      id: stored.username === 'admin' ? 1 : 2,
      name: stored.username === 'admin' ? 'Administrateur' : 'Utilisateur',
      authorizations: stored.username === 'admin' ? ['admin', 'user'] : ['user'],
      routes: null,
      isDeleted: false,
      deletedAt: null,
    }],
    countries: COUNTRIES,
    regions: REGIONS,
    prefectures: PREFECTURES,
    communes: COMMUNES,
    hospitals: HOSPITALS,
    districtQuartiers: DISTRICT_QUARTIERS,
    villageSecteurs: VILLAGE_SECTEURS,
    chws: CHWS,
    recos: RECOS,
    role: {
      isSuperUser: stored.username === 'admin',
      canUseOfflineMode: true,
      canViewMaps: true,
      canViewReports: true,
      canViewDashboards: true,
      canManageData: stored.username === 'admin',
      canCreateUser: stored.username === 'admin',
      canUpdateUser: stored.username === 'admin',
      canDeleteUser: stored.username === 'admin',
      canCreateRole: stored.username === 'admin',
      canUpdateRole: stored.username === 'admin',
      canDeleteRole: stored.username === 'admin',
      canValidateData: true,
      canSendDataToDhis2: stored.username === 'admin',
      canViewUsers: true,
      canViewRoles: true,
      canDownloadData: true,
      canSendSms: stored.username === 'admin',
      canLogout: true,
      canUpdateProfile: true,
      canUpdatePassword: true,
      canUpdateLanguage: true,
      canViewNotifications: true,
      mustChangeDefaultPassword: stored.mustChangeDefaultPassword,
    },
    isActive: stored.isActive,
    token: token,
    userLogo: '',
    mustLogin: false,
    mustChangeDefaultPassword: stored.mustChangeDefaultPassword,
    hasChangedDefaultPassword: !stored.mustChangeDefaultPassword,
    isDeleted: false,
    deletedAt: null,
  };
}

class AuthService {
  constructor() {
    initTestUsers();
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    const { items: users } = db.list<StoredUser>('users', {
      where: { username: credentials.username },
    });

    if (users.length === 0) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const user = users[0];

    if (user.password !== credentials.password) {
      throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new Error('Ce compte est désactivé');
    }

    const token = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '-refresh');

    // Stocker le token actif
    localStorage.setItem('currentUserId', user.id);

    return {
      token,
      refreshToken,
      user: toFullUser(user, token),
      expiresIn: 3600,
      mustChangeDefaultPassword: user.mustChangeDefaultPassword,
      orgunits: {},
      persons: {},
    };
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    localStorage.removeItem('currentUserId');
  }

  async refreshToken(_refreshToken: string): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      throw new Error('Session expirée');
    }

    const user = db.getById<StoredUser>('users', userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const newToken = generateMockToken(user.id);
    const newRefreshToken = generateMockToken(user.id + '-refresh');

    return {
      token: newToken,
      refreshToken: newRefreshToken,
      user: toFullUser(user, newToken),
      expiresIn: 3600,
      mustChangeDefaultPassword: user.mustChangeDefaultPassword,
      orgunits: {},
      persons: {},
    };
  }

  async getCurrentUser(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const user = db.getById<StoredUser>('users', userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    const token = generateMockToken(user.id);
    return toFullUser(user, token);
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      throw new Error('Non authentifié');
    }

    const user = db.getById<StoredUser>('users', userId);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (user.password !== payload.currentPassword) {
      throw new Error('Mot de passe actuel incorrect');
    }

    if (payload.newPassword !== payload.confirmPassword) {
      throw new Error('Les mots de passe ne correspondent pas');
    }

    if (payload.newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    db.update<StoredUser>('users', userId, {
      password: payload.newPassword,
      mustChangeDefaultPassword: false,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { items: users } = db.list<StoredUser>('users', {
      where: { email },
    });

    if (users.length === 0) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      console.log('[AuthService] Email non trouvé:', email);
    }

    // Simulation d'envoi d'email
    console.log('[AuthService] Email de réinitialisation envoyé à:', email);
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    // Simulation - dans une vraie app, on décoderait le token pour obtenir l'userId
    console.log('[AuthService] Mot de passe réinitialisé');
  }

  async validateToken(_token: string): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const userId = localStorage.getItem('currentUserId');
      return !!userId;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();

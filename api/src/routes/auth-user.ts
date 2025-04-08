
import { AuthUserController } from "../controllers/auth-user";
import { Router } from 'express';
import { Middelware } from "../middleware/auth";

const AuthUserRouter = Router();

AuthUserRouter.post('/login', AuthUserController.login);

AuthUserRouter.post('/register', Middelware.authMiddleware, AuthUserController.register);

AuthUserRouter.post('/new-token', Middelware.authMiddleware, AuthUserController.newToken);




AuthUserRouter.post('/check-reload-user', Middelware.authMiddleware, AuthUserController.CheckReloadUser);

AuthUserRouter.post('/users', Middelware.authMiddleware, AuthUserController.allUsers);
AuthUserRouter.post('/update-user', Middelware.authMiddleware, AuthUserController.updateUser);
AuthUserRouter.post('/delete-user', Middelware.authMiddleware, AuthUserController.deleteUser);

AuthUserRouter.post('/update-user-password', Middelware.authMiddleware, AuthUserController.updateUserPassWord);
AuthUserRouter.post('/update-user-profile', Middelware.authMiddleware, AuthUserController.updateUserProfile);

AuthUserRouter.post('/roles', Middelware.authMiddleware, AuthUserController.GetRolesList);
AuthUserRouter.post('/create-role', Middelware.authMiddleware, AuthUserController.CreateRole);
AuthUserRouter.post('/update-role', Middelware.authMiddleware, AuthUserController.UpdateRole);
AuthUserRouter.post('/delete-role', Middelware.authMiddleware, AuthUserController.DeleteRole);

AuthUserRouter.post('/authorizations', Middelware.authMiddleware, AuthUserController.UserAuthorizations);
AuthUserRouter.post('/routes', Middelware.authMiddleware, AuthUserController.UserRoutes);


export = AuthUserRouter;

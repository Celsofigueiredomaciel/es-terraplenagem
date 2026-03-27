import { Router } from 'express';
import { login, trocarSenha, perfil } from '../controllers/authController';
import { autenticar } from '../middleware/auth';

const router = Router();

router.post('/login',        login);
router.post('/trocar-senha', autenticar, trocarSenha);
router.get('/perfil',        autenticar, perfil);

export default router;
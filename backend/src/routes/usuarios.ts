import { Router } from 'express';
import { autenticar, apenasAdmin } from '../middleware/auth';
import { listar, criar, atualizar, alterarStatus, resetarSenha } from '../controllers/usuariosController';

const router = Router();

router.get('/',                autenticar, apenasAdmin, listar);
router.post('/',               autenticar, apenasAdmin, criar);
router.put('/:id',             autenticar, apenasAdmin, atualizar);
router.patch('/:id/status',    autenticar, apenasAdmin, alterarStatus);
router.patch('/:id/senha',     autenticar, apenasAdmin, resetarSenha);

export default router;

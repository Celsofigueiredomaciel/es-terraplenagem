import { Router } from 'express';
import { listar, atualizar } from '../controllers/configController';
import { autenticar, apenasAdmin } from '../middleware/auth';

const router = Router();

router.get('/',        listar);
router.put('/:chave',  autenticar, apenasAdmin, atualizar);

export default router;
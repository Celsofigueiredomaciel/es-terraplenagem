import { Router } from 'express';
import { autenticar } from '../middleware/auth';
import { criar, listar, buscarPorId, atualizarStatus, remover, removerPorPeriodo } from '../controllers/orcamentosController';
const router = Router();

router.post('/',    criar);
router.get('/',     autenticar, listar);
router.get('/:id',  autenticar, buscarPorId);
router.put('/:id',  autenticar, atualizarStatus);
router.delete('/periodo/:meses', autenticar, removerPorPeriodo);
router.delete('/:id',            autenticar, remover);

export default router;
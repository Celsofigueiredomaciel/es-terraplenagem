import { Router } from 'express';
import { listar, buscarPorId, criar, atualizar, deletar, reordenar } from '../controllers/midiasController';
import { autenticar } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/',            listar);
router.get('/:id',         buscarPorId);
router.post('/',           autenticar, upload.single('arquivo'), criar);
router.put('/reordenar',   autenticar, reordenar);
router.put('/:id',         autenticar, atualizar);
router.delete('/:id',      autenticar, deletar);

export default router;
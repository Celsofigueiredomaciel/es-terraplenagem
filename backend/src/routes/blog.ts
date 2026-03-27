import { Router } from 'express';
import { listar, buscarPorSlug, criar, atualizar, deletar } from '../controllers/blogController';
import { autenticar } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/',        listar);
router.get('/:slug',   buscarPorSlug);
router.post('/',       autenticar, upload.single('capa'), criar);
router.put('/:id',     autenticar, upload.single('capa'), atualizar);
router.delete('/:id',  autenticar, deletar);

export default router;
import { Router } from 'express';
import { autenticar } from '../middleware/auth';
import { upload } from '../middleware/upload'; // ✅ middleware central
import { listar, listarAdmin, criar, atualizar, remover } from '../controllers/produtosController';

const router = Router();

router.get   ('/',      listar);
router.get   ('/admin', autenticar, listarAdmin);
router.post  ('/',      autenticar, upload.single('foto'), criar);
router.put   ('/:id',   autenticar, upload.single('foto'), atualizar);
router.delete('/:id',   autenticar, remover);

export default router;
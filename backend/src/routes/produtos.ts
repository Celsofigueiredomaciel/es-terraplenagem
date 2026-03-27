import { Router } from 'express';
import multer  from 'multer';
import path    from 'path';
import { autenticar } from '../middleware/auth';
import { listar, listarAdmin, criar, atualizar, remover } from '../controllers/produtosController';

const router  = Router();
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get   ('/',       listar);
router.get   ('/admin',  autenticar, listarAdmin);
router.post  ('/',       autenticar, upload.single('foto'), criar);
router.put   ('/:id',    autenticar, upload.single('foto'), atualizar);
router.delete('/:id',    autenticar, remover);

export default router;
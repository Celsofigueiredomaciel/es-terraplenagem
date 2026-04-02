import { Router } from 'express';
import { listar, listarAdmin, atualizar } from '../controllers/configController'; // ✅ listarAdmin
import { autenticar, apenasAdmin } from '../middleware/auth';

const router = Router();

router.get('/',         listar);                          // pública — só chaves públicas
router.get('/admin',    autenticar, apenasAdmin, listarAdmin); // ✅ admin — todas as chaves
router.put('/:chave',   autenticar, apenasAdmin, atualizar);

export default router;
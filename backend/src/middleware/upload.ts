import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const nome = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, nome);
  },
});

const filtro = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const permitidos = /jpeg|jpg|png|webp|gif|mp4|mov|avi|webm/;
  const ext  = permitidos.test(path.extname(file.originalname).toLowerCase());
  const mime = permitidos.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(new Error('Formato não suportado. Use: JPG, PNG, WEBP, MP4, MOV'));
};

export const upload = multer({
  storage,
  fileFilter: filtro,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_SIZE_MB || 50) * 1024 * 1024 },
});
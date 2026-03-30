import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 10,
};

export default function () {
  const res = http.post(
    'http://localhost:3000/api/auth/login',
    JSON.stringify({ email: 'admin@teste.com', senha: 'senhaerrada' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  console.log(`Tentativa: status ${res.status} — ${res.body}`);
  check(res, {
    'resposta válida': r => [401, 429].includes(r.status)
  });
}

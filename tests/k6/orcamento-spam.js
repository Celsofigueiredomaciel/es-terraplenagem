import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 8,
};

export default function () {
  const res = http.post(
    'http://localhost:3000/api/orcamentos',
    JSON.stringify({
      nome: 'Teste K6', telefone: '91999999999',
      email: 'teste@k6.com', servico: 'Terraplenagem',
      descricao: 'Teste automatizado de carga'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  console.log(`Envio: status ${res.status} — ${res.body}`);
  check(res, {
    'resposta válida': r => [201, 400, 429].includes(r.status)
  });
}

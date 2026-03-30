import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 30  },  // aquece com 30
    { duration: '30s', target: 100 },  // sobe para 100
    { duration: '1m',  target: 100 },  // mantém 100 por 1 min
    { duration: '30s', target: 0   },  // desce para 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed:   ['rate<0.01'], // menos de 1% de falhas
  },
};

export default function () {
  const rotas = [
    '/api/config',
    '/api/midias',
    '/api/blog?pagina=1&limite=9',
    '/api/produtos',
    '/api/historia',
  ];
  rotas.forEach(rota => {
    const r = http.get(`http://localhost:3000${rota}`);
    check(r, { [`${rota} OK`]: res => res.status === 200 });
  });
  sleep(1);
}

const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it("répond 200 et confirme que l'API est en ligne", async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

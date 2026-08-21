'use strict';

const request = require('supertest');
const { crearApp } = require('../src/app');

describe('Aplicacion web Hola Mundo', () => {
  let app;

  beforeAll(() => {
    app = crearApp();
  });

  describe('GET /', () => {
    it('devuelve 200 y sirve la pagina HTML', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    it('la pagina contiene el texto "Hola Mundo"', async () => {
      const res = await request(app).get('/');

      expect(res.text).toContain('Hola Mundo');
    });
  });

  describe('GET /api/saludo', () => {
    it('devuelve el saludo por defecto en JSON', async () => {
      const res = await request(app).get('/api/saludo');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.mensaje).toBe('Hola Mundo!');
      expect(res.body.autor).toBe('Triana Garcia');
    });

    it('saluda al nombre recibido por query string', async () => {
      const res = await request(app).get('/api/saludo').query({ nombre: 'Triana' });

      expect(res.statusCode).toBe(200);
      expect(res.body.mensaje).toBe('Hola Triana!');
    });

    it('ignora un nombre vacio y usa el valor por defecto', async () => {
      const res = await request(app).get('/api/saludo').query({ nombre: '   ' });

      expect(res.statusCode).toBe(200);
      expect(res.body.mensaje).toBe('Hola Mundo!');
    });
  });

  describe('GET /health', () => {
    it('responde 200 con status ok', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
    });
  });

  describe('Rutas inexistentes', () => {
    it('devuelve 404 con un mensaje de error', async () => {
      const res = await request(app).get('/no-existe');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Ruta no encontrada');
      expect(res.body.ruta).toBe('/no-existe');
    });
  });
});

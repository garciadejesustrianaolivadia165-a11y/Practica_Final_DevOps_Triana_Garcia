'use strict';

const path = require('path');
const express = require('express');

const APP_NAME = 'Practica Final DevOps';
const AUTOR = 'Triana Garcia';
const VERSION = process.env.npm_package_version || '1.0.0';

/**
 * Construye la aplicacion Express sin arrancar el servidor.
 * Separar la construccion del listen permite que las pruebas
 * unitarias monten la app en memoria con supertest.
 */
function crearApp() {
  const app = express();

  app.use(express.json());
  app.disable('x-powered-by');

  // Pagina web "Hola Mundo"
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // API que devuelve el saludo en JSON
  app.get('/api/saludo', (req, res) => {
    const nombre = typeof req.query.nombre === 'string' && req.query.nombre.trim() !== ''
      ? req.query.nombre.trim()
      : 'Mundo';

    res.status(200).json({
      mensaje: `Hola ${nombre}!`,
      app: APP_NAME,
      autor: AUTOR,
      version: VERSION
    });
  });

  // Health check usado por Render y por Docker HEALTHCHECK
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      entorno: process.env.NODE_ENV || 'development'
    });
  });

  // Cualquier otra ruta no existe
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', ruta: req.originalUrl });
  });

  return app;
}

module.exports = { crearApp, APP_NAME, AUTOR };

'use strict';

const { crearApp } = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = crearApp();

const server = app.listen(PORT, HOST, () => {
  console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
});

// Render y Docker envian SIGTERM al detener el contenedor
const apagar = (senal) => {
  console.log(`Recibida ${senal}, cerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));

module.exports = server;

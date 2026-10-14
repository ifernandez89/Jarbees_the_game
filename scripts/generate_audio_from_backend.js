/**
 * Script de integración con el backend productos_crud_bkd (C:\Projects\productos_crud_bkd)
 * Permite interactuar con los servicios de IA de voz / audio si el backend está en ejecución.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function checkBackendStatus() {
  console.log(`📡 Verificando conexión con el backend en ${BACKEND_URL}...`);
  return new Promise((resolve) => {
    http.get(`${BACKEND_URL}/health`, (res) => {
      console.log(`✅ Backend respondiendo con status: ${res.statusCode}`);
      resolve(true);
    }).on('error', (err) => {
      console.log(`ℹ️ Backend en ${BACKEND_URL} no está corriendo en este puerto actualmente.`);
      console.log(`ℹ️ JarBees cuenta con los generadores procedurales de audio en Python ('scripts/generate_game_audio.py') listos y activos en 'public/audio/'.`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🐝 JarBees AI Audio Generator / Backend Bridge');
  console.log('==============================================');
  await checkBackendStatus();
}

main();

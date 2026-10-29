@echo off
title Clipboard Sync - Server
cd /d "%~dp0server"
if not exist node_modules npm install
npm start

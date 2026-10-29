@echo off
title Clipboard Sync - Windows Client
cd /d "%~dp0"
if not exist node_modules npm install
node client.js

@echo off
cd /d "%~dp0"
echo.
echo  Socialmood dev server
echo  http://localhost:3156/index.html
echo.
start "" "http://localhost:3156/index.html"
node server.js

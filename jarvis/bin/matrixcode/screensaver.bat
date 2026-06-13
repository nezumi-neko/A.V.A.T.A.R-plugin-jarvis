@echo off
:: Lancer matrix.scr en plein écran depuis son propre dossier
cd /d "%~dp0"
start "" "%~dp0matrix.scr" /s

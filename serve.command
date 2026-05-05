#!/bin/bash
# Doble-click sobre este archivo para levantar el sitio en http://localhost:8000
# y abrirlo en el navegador default.

# Ir a la carpeta donde vive este script
cd "$(dirname "$0")"

PORT=8000

# Si el puerto ya esta en uso, levantar uno libre arriba
while lsof -i :$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT+1))
done

URL="http://localhost:$PORT/index.html"

echo "================================================"
echo " Con la Sal en la Piel — server local"
echo " URL: $URL"
echo " Cerra esta ventana o Ctrl+C para parar"
echo "================================================"

# Abrir el navegador en 1.5s para dar tiempo al server
( sleep 1.5 && open "$URL" ) &

# Levantar el server en foreground asi se cierra al cerrar la terminal
python3 -m http.server $PORT

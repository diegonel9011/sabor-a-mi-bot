# Sabor a Mi – Bot WhatsApp

Bot inteligente con IA (Claude) para tomar pedidos para llevar vía WhatsApp.

## Variables de entorno requeridas

En Railway, configura estas variables:

| Variable | Valor |
|---|---|
| `WHAPI_TOKEN` | Tu token de Whapi.cloud |
| `ANTHROPIC_KEY` | Tu API key de Anthropic |

## Deploy en Railway

1. Sube este proyecto a GitHub
2. En Railway → New Project → Deploy from GitHub
3. Agrega las variables de entorno arriba
4. Railway te da una URL pública, por ejemplo: `https://sabor-a-mi-bot.up.railway.app`
5. Esa URL + `/webhook` la pones en Whapi como webhook

## URL del webhook

`https://TU-URL.up.railway.app/webhook`

# Olli Security Hardening

## Controles implementados

- `.env*`, `data/`, SQLite y bases locales quedan fuera de Git mediante `.gitignore`.
- `npm run security:check` bloquea rutas privadas y patrones comunes de secretos antes de publicar.
- Se elimino `firebase-applet-config.json` porque no se usa en Olli local y contenia una API key heredada.
- Cookies de sesion `httpOnly`, `sameSite=lax` y `secure` en produccion.
- Headers basicos de seguridad:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restrictivo
  - `Strict-Transport-Security` en produccion
- Rate limits en memoria:
  - auth: login/registro
  - recuperacion de contrasena
  - escrituras
  - IA/chat/resumen
  - transcripcion
  - envio de email
- Limites de payload por ruta:
  - API general: 8 MB
  - transcripcion: 60 MB JSON, 42 MB base64 de audio
  - email PDF: 10 MB base64 de PDF
- Validacion de MIME de audio.
- Sanitizacion basica de campos de email y nombre de PDF.
- El endpoint de email requiere sesion autenticada.
- Errores de produccion evitan filtrar detalles internos.

## Vulnerabilidades principales a vigilar

- Robo o filtracion de API keys de Gemini/SMTP.
- Fuerza bruta contra login o recuperacion de contrasena.
- Abuso de cuota Gemini mediante muchas peticiones de chat/resumen/transcripcion.
- Subida de audio demasiado grande o de tipo no permitido.
- XSS por texto de transcripciones, titulos, carpetas o resumenes.
- CSRF si se expone Olli en internet con cookies.
- Backups sin cifrar.
- SQLite expuesto por una mala configuracion de Docker/AWS.
- Logs con datos sensibles.
- CORS abierto en despliegue publico.
- HTTPS mal configurado.

## Pendientes recomendados antes de AWS

- Cifrar `api_key` en SQLite con una clave `OLLIE_SECRET` o KMS.
- Agregar token CSRF para rutas mutables cuando se use dominio publico.
- Agregar CSP estricta en produccion despues de validar Vite/React.
- Mover rate limits a Redis si hay mas de una instancia.
- Agregar backups cifrados y rotacion.
- Agregar auditoria local de acciones sensibles.
- Agregar escaneo de dependencias en CI.
- Restringir SSH de AWS a IPs permitidas.
- Usar HTTPS obligatorio con Caddy/Nginx.

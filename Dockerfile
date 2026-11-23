# =============================================================================
#  Imagen de producción del frontend de Retiro Seguro.
#  Vite compila a estáticos y nginx los sirve. VITE_API_URL se incrusta en el
#  bundle al compilar: por defecto /api/v1, el mismo origen que sirve el front,
#  así la API no necesita CORS (igual que el proxy de Vite en desarrollo).
# =============================================================================

FROM node:24-alpine AS compilacion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.29-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

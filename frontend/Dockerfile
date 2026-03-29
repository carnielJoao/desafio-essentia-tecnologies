# --- build ---
    FROM node:20-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build    # gera dist/frontend/browser/index.html
    
    # --- runtime (nginx) ---
    FROM nginx:alpine
    WORKDIR /usr/share/nginx/html
    
    # copia TUDO que o Angular gerou (mantém a estrutura com a pasta browser/)
    COPY --from=build /app/dist/frontend/ /usr/share/nginx/html/
    
    # substitui a conf para apontar o root na pasta browser/browser/
    RUN rm -f /etc/nginx/conf.d/default.conf && \
        printf 'server {\n\
      listen 80;\n\
      server_name localhost;\n\
      root /usr/share/nginx/html/browser/browser;\n\
      index index.html;\n\
      location / {\n\
        try_files $uri $uri/ /index.html;\n\
      }\n\
      location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|map)$ {\n\
        expires 7d;\n\
        add_header Cache-Control \"public\";\n\
      }\n\
    }\n' > /etc/nginx/conf.d/default.conf
    
    # opcional: 1 worker
    RUN sed -i 's/worker_processes auto;/worker_processes 1;/' /etc/nginx/nginx.conf
    
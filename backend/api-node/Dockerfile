# -------- Build (com deps de dev) --------
    FROM node:22-alpine AS build
    WORKDIR /app
    
    # 1) Dependências
    COPY package*.json ./
    # se tiver package-lock.json, mantenha o ci; senão troque por "npm install"
    RUN npm ci
    
    # 2) Código e Prisma
    COPY tsconfig*.json ./
    COPY prisma ./prisma
    RUN npx prisma generate
    COPY src ./src
    
    # 3) Build e preparar node_modules para produção
    RUN npm run build
    RUN npm prune --omit=dev
    
    # -------- Runtime (sem internet) --------
    FROM node:22-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Copia apenas o necessário
    COPY package*.json ./
    COPY --from=build /app/node_modules ./node_modules
    COPY --from=build /app/dist ./dist
    COPY --from=build /app/prisma ./prisma
    COPY --from=build /app/src/generated ./src/generated
    
    EXPOSE 3001
    CMD ["node", "dist/server.js"]
    
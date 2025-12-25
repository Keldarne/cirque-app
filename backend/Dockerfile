FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (inclut nodemon pour le dev)
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port backend
EXPOSE 4000

# Commande par défaut (sera override par docker-compose pour le dev)
CMD ["npm", "start"]

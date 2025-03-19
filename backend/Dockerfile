# Use the official Node.js image as a base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json first (optimizes caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the backend application
COPY . .

# Expose the port your Express server runs on
EXPOSE 4000

# Set environment variables for production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]

# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Expose the port your backend runs on (e.g., 5000)
EXPOSE 8000

# Command to run your app
CMD ["npm", "start"]



# fetch base image

FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app files
COPY  . .

# Generate the Prisma client
RUN npx prisma generate

# (Optional) Run migrations if you want:
RUN npx prisma migrate deploy


# Expose app port
EXPOSE 4000

# Start the app
CMD ["npm", "run", "dev"]

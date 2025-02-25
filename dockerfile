# Use the official Playwright image with dependencies
FROM mcr.microsoft.com/playwright:v1.40.0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the entire application
COPY . .

# Set permissions (if needed)
RUN chmod -R 777 /app

# Run Playwright browser dependencies installation
RUN npx playwright install --with-deps

# Set the entry point
CMD ["node", "index.js"]  

# Steps to Build and Run the Docker Container:

#     Build the Docker Image
#       docker build -t hackernews-scraper .
#     Run the Container
#       docker run --rm hackernews-scraper
#     Run in the Background
#       docker run -d --name scraper hackernews-scraper
#     Stop the Container (if needed)
#       docker stop scraper
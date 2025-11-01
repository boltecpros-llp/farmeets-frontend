# Stage 1: Build the Angular app
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install --force && npm run build -- --output-path=dist

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./public/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

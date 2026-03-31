# Escolha uma imagem base do PHP
FROM php:8.0-apache

# Instalar extensões necessárias
RUN docker-php-ext-install pdo pdo_mysql

# Configurar o diretório de trabalho no container
WORKDIR /var/www/html

# Copiar o código do backend para dentro do container
COPY . .

# Instalar dependências PHP
RUN composer install --no-dev --optimize-autoloader

# Expor a porta onde o servidor será executado
EXPOSE 80

# Comando para iniciar o servidor Laravel
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--po rt=80"]
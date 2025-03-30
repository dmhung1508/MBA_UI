# Bước 1: Sử dụng node làm image cơ sở
FROM node:18-alpine

# Bước 2: Thiết lập thư mục làm việc
WORKDIR /app

# Bước 3: Sao chép file package.json và package-lock.json
COPY package*.json ./

# Bước 4: Cài đặt các package
RUN npm install

# Bước 5: Sao chép tất cả mã nguồn vào thư mục làm việc
COPY . .

# Bước 6: Build ứng dụng
RUN npm run build

# Bước 7: Cung cấp cổng mà ứng dụng sẽ chạy
EXPOSE 5001

# Bước 8: Chạy ứng dụng
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5001"]

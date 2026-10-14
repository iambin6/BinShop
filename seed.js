require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');
const User = require('./models/userModel');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_db';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Product.deleteMany();
    await Order.deleteMany();
    await User.deleteMany();

    // 1. Seed Accounts (Mật khẩu được hash tự động qua pre-save hook của userModel)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('123456', 10);

    await User.insertMany([
      {
        username: 'admin',
        email: 'admin@binshop.com',
        password: adminPassword,
        fullName: 'Quản trị viên',
        role: 'admin'
      },
      {
        username: 'bin',
        email: 'bin@gmail.com',
        password: userPassword,
        fullName: 'Nguyễn Văn Bin',
        role: 'user'
      },
      {
        username: 'khachhang',
        email: 'khachhang@gmail.com',
        password: userPassword,
        fullName: 'Trần Thị Mai',
        role: 'user'
      }
    ]);
    console.log('Users seeded successfully!');

    // 2. Seed Products
    await Product.insertMany([
      { productName: 'Wireless Mouse', category: 'Electronics', stockStatus: 'in_stock', unitPrice: 250000, tags: ['bestseller','wireless','accessory'] },
      { productName: 'Mechanical Keyboard', category: 'Electronics', stockStatus: 'in_stock', unitPrice: 1200000, tags: ['gaming','rgb'] },
      { productName: 'USB-C Cable', category: 'Accessories', stockStatus: 'in_stock', unitPrice: 90000, tags: ['cable'] },
      { productName: 'Gaming Headset', category: 'Audio', stockStatus: 'in_stock', unitPrice: 850000, tags: ['gaming','surround'] },
      { productName: 'Monitor Stand', category: 'Accessories', stockStatus: 'in_stock', unitPrice: 350000, tags: ['ergonomic','office'] },
      { productName: 'Old Webcam', category: 'Electronics', stockStatus: 'discontinued', unitPrice: 400000, tags: ['legacy'] }
    ]);
    console.log('Products seeded successfully!');

    // 3. Seed Orders (Đủ dữ liệu để test tìm kiếm, phân trang và thống kê)
    await Order.insertMany([
      { customerName: 'Nguyen Thi Lan', productName: 'Wireless Mouse', quantity: 2, orderDate: new Date('2026-10-10'), totalPrice: 500000 },
      { customerName: 'Pham Van Duc', productName: 'Mechanical Keyboard', quantity: 1, orderDate: new Date('2026-10-11'), totalPrice: 1200000 },
      { customerName: 'Le Hoang Nam', productName: 'Gaming Headset', quantity: 2, orderDate: new Date('2026-10-12'), totalPrice: 1700000 },
      { customerName: 'Tran Minh Tri', productName: 'USB-C Cable', quantity: 5, orderDate: new Date('2026-10-13'), totalPrice: 450000 },
      { customerName: 'Nguyen Thi Lan', productName: 'Monitor Stand', quantity: 1, orderDate: new Date('2026-10-13'), totalPrice: 350000 },
      { customerName: 'Hoang Van Thang', productName: 'Wireless Mouse', quantity: 3, orderDate: new Date('2026-10-14'), totalPrice: 750000 },
      { customerName: 'Vu Thi Huong', productName: 'Mechanical Keyboard', quantity: 2, orderDate: new Date('2026-10-14'), totalPrice: 2400000 }
    ]);
    console.log('Orders seeded successfully!');

    console.log('Seeded all successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
})();
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/productModel');
const Order = require('./models/orderModel');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_db';

(async () => {
  await mongoose.connect(MONGO_URI);
  await Product.deleteMany(); await Order.deleteMany();

  await Product.insertMany([
    { productName: 'Wireless Mouse', category: 'Electronics', stockStatus: 'in_stock', unitPrice: 250000, tags: ['bestseller','wireless','accessory'] },
    { productName: 'Mechanical Keyboard', category: 'Electronics', stockStatus: 'in_stock', unitPrice: 1200000, tags: ['gaming','rgb'] },
    { productName: 'USB-C Cable', category: 'Accessories', stockStatus: 'out_of_stock', unitPrice: 90000, tags: ['cable'] },
    { productName: 'Old Webcam', category: 'Electronics', stockStatus: 'discontinued', unitPrice: 400000, tags: ['legacy'] }
  ]);

  await Order.insertMany([
    { customerName: 'Nguyen Thi Lan', productName: 'Wireless Mouse', quantity: 2, orderDate: '2024-10-17T00:00:00Z', totalPrice: 500000 },
    { customerName: 'Pham Van Duc', productName: 'Mechanical Keyboard', quantity: 1, orderDate: '2024-10-18T00:00:00Z', totalPrice: 1200000 }
  ]);
  console.log('Seeded'); process.exit();
})();
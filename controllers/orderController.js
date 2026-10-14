const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findProduct = name =>
  Product.findOne({ productName: new RegExp('^' + esc(name.trim()) + '$', 'i') });

exports.list = async (req, res) => {
  const orders = await Order.find().sort({ orderDate: 1 });
  res.render('order', { orders });
};

exports.createForm = async (req, res) => {
  const products = await Product.find();
  res.render('createOrder', { products, error: null, old: {} });
};

exports.create = async (req, res) => {
  const { customerName, productName, quantity, orderDate } = req.body;
  const product = await findProduct(productName);

  if (!product) {
    const products = await Product.find();
    return res.status(400).render('createOrder', {
      products, old: req.body,
      error: `Product "${productName}" does not exist.`
    });
  }

  await Order.create({
    customerName,
    productName: product.productName,
    quantity: Number(quantity),
    orderDate,
    totalPrice: Number(quantity) * product.unitPrice
  });
  res.redirect('/orders');
};

exports.updateForm = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.redirect('/orders');
  const products = await Product.find();
  res.render('updateOrder', { order, products, error: null });
};

// ---- (9) Xử lý sửa đơn ----
exports.update = async (req, res) => {
  const { customerName, productName, quantity, orderDate } = req.body;
  const product = await findProduct(productName);

  if (!product) {
    const order = await Order.findById(req.params.id);
    const products = await Product.find();
    Object.assign(order, { customerName, productName, quantity, orderDate });
    return res.status(400).render('updateOrder', {
      order, products, error: `Product "${productName}" does not exist.`
    });
  }

  await Order.findByIdAndUpdate(req.params.id, {
    customerName,
    productName: product.productName,
    quantity: Number(quantity),
    orderDate,
    totalPrice: Number(quantity) * product.unitPrice
  }, { runValidators: true });
  res.redirect('/orders');
};

exports.remove = async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.redirect('/orders');
};
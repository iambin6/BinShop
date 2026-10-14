const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findProduct = name =>
  Product.findOne({ productName: new RegExp('^' + esc(name.trim()) + '$', 'i') });

exports.list = async (req, res) => {
  try {
    const { search = '', fromDate = '', toDate = '', sortBy = 'date-desc', page = 1 } = req.query;

    const query = {};

    // 1. Tìm kiếm theo tên khách hàng hoặc tên sản phẩm
    if (search.trim()) {
      const regex = new RegExp(esc(search.trim()), 'i');
      query.$or = [
        { customerName: regex },
        { productName: regex }
      ];
    }

    // 1.1 Lọc theo khoảng ngày đặt hàng
    if (fromDate || toDate) {
      query.orderDate = {};
      if (fromDate) {
        query.orderDate.$gte = new Date(fromDate + 'T00:00:00.000Z');
      }
      if (toDate) {
        query.orderDate.$lte = new Date(toDate + 'T23:59:59.999Z');
      }
    }

    // 2. Sắp xếp
    let sortOptions = { orderDate: -1 };
    switch (sortBy) {
      case 'date-asc':
        sortOptions = { orderDate: 1 };
        break;
      case 'date-desc':
        sortOptions = { orderDate: -1 };
        break;
      case 'price-asc':
        sortOptions = { totalPrice: 1 };
        break;
      case 'price-desc':
        sortOptions = { totalPrice: -1 };
        break;
      case 'name-asc':
        sortOptions = { customerName: 1 };
        break;
      case 'name-desc':
        sortOptions = { customerName: -1 };
        break;
      default:
        sortOptions = { orderDate: -1 };
    }

    // 3. Phân trang
    const currentPage = Math.max(1, parseInt(page) || 1);
    const limit = 5; // 5 đơn hàng mỗi trang
    const totalMatching = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalMatching / limit) || 1;
    const skip = (currentPage - 1) * limit;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // 4. Thống kê toàn bộ đơn hàng trong hệ thống (Dashboard Statistics)
    const statsResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          totalProductsSold: { $sum: '$quantity' }
        }
      }
    ]);

    const stats = statsResult[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProductsSold: 0
    };

    res.render('order', {
      orders,
      stats,
      filters: { search, fromDate, toDate, sortBy },
      pagination: {
        currentPage,
        totalPages,
        totalMatching,
        limit
      }
    });
  } catch (err) {
    console.error('List orders error:', err);
    req.session.errorMessage = 'Có lỗi xảy ra khi tải danh sách đơn hàng.';
    res.render('order', {
      orders: [],
      stats: { totalOrders: 0, totalRevenue: 0, totalProductsSold: 0 },
      filters: { search: '', fromDate: '', toDate: '', sortBy: 'date-desc' },
      pagination: { currentPage: 1, totalPages: 1, totalMatching: 0, limit: 5 }
    });
  }
};

exports.createForm = async (req, res) => {
  try {
    const products = await Product.find({ stockStatus: { $ne: 'discontinued' } });
    res.render('createOrder', { products, error: null, old: {} });
  } catch (err) {
    console.error('Create form error:', err);
    res.redirect('/orders');
  }
};

exports.create = async (req, res) => {
  const { customerName, productName, quantity, orderDate } = req.body;
  const products = await Product.find({ stockStatus: { $ne: 'discontinued' } });

  try {
    if (!customerName || !productName || !quantity || !orderDate) {
      return res.status(400).render('createOrder', {
        products,
        old: req.body,
        error: 'Vui lòng điền đầy đủ tất cả các trường thông tin.'
      });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).render('createOrder', {
        products,
        old: req.body,
        error: 'Số lượng đặt mua phải là số nguyên lớn hơn 0.'
      });
    }

    const product = await findProduct(productName);
    if (!product) {
      return res.status(400).render('createOrder', {
        products,
        old: req.body,
        error: `Sản phẩm "${productName}" không tồn tại trong hệ thống.`
      });
    }

    await Order.create({
      customerName: customerName.trim(),
      productName: product.productName,
      quantity: qty,
      orderDate: new Date(orderDate),
      totalPrice: qty * product.unitPrice
    });

    req.session.successMessage = `Tạo thành công đơn hàng cho khách "${customerName}" (${product.productName} x ${qty})!`;
    res.redirect('/orders');
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).render('createOrder', {
      products,
      old: req.body,
      error: 'Có lỗi xảy ra khi tạo đơn hàng: ' + err.message
    });
  }
};

exports.updateForm = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.session.errorMessage = 'Không tìm thấy đơn hàng cần cập nhật!';
      return res.redirect('/orders');
    }
    const products = await Product.find({ stockStatus: { $ne: 'discontinued' } });
    res.render('updateOrder', { order, products, error: null });
  } catch (err) {
    console.error('Update form error:', err);
    req.session.errorMessage = 'Lỗi truy xuất đơn hàng.';
    res.redirect('/orders');
  }
};

exports.update = async (req, res) => {
  const { customerName, productName, quantity, orderDate } = req.body;
  const products = await Product.find({ stockStatus: { $ne: 'discontinued' } });

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.session.errorMessage = 'Không tìm thấy đơn hàng để cập nhật!';
      return res.redirect('/orders');
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      Object.assign(order, { customerName, productName, quantity, orderDate });
      return res.status(400).render('updateOrder', {
        order,
        products,
        error: 'Số lượng đặt mua phải là số nguyên lớn hơn 0.'
      });
    }

    const product = await findProduct(productName);
    if (!product) {
      Object.assign(order, { customerName, productName, quantity, orderDate });
      return res.status(400).render('updateOrder', {
        order,
        products,
        error: `Sản phẩm "${productName}" không tồn tại trong hệ thống.`
      });
    }

    await Order.findByIdAndUpdate(req.params.id, {
      customerName: customerName.trim(),
      productName: product.productName,
      quantity: qty,
      orderDate: new Date(orderDate),
      totalPrice: qty * product.unitPrice
    }, { runValidators: true });

    req.session.successMessage = `Đã cập nhật đơn hàng của khách "${customerName}" thành công!`;
    res.redirect('/orders');
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).render('updateOrder', {
      order: { _id: req.params.id, ...req.body },
      products,
      error: 'Có lỗi xảy ra khi cập nhật đơn hàng: ' + err.message
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (deleted) {
      req.session.successMessage = `Đã xóa đơn hàng của khách "${deleted.customerName}" thành công!`;
    } else {
      req.session.errorMessage = 'Đơn hàng không tồn tại hoặc đã bị xóa trước đó.';
    }
  } catch (err) {
    console.error('Remove order error:', err);
    req.session.errorMessage = 'Có lỗi xảy ra khi xóa đơn hàng.';
  }
  res.redirect('/orders');
};
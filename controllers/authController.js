const User = require('../models/userModel');

exports.loginForm = (req, res) => {
  res.render('login', { old: {} });
};

exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      req.session.errorMessage = 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!';
      return res.status(400).render('login', { old: req.body });
    }

    const query = usernameOrEmail.includes('@')
      ? { email: usernameOrEmail.toLowerCase().trim() }
      : { username: usernameOrEmail.trim() };

    const user = await User.findOne(query);

    if (!user) {
      req.session.errorMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      return res.status(400).render('login', { old: req.body });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.session.errorMessage = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      return res.status(400).render('login', { old: req.body });
    }

    // Save session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username,
      role: user.role
    };

    req.session.successMessage = `Xin chào ${user.fullName || user.username}, bạn đã đăng nhập thành công!`;
    return res.redirect('/orders');
  } catch (err) {
    console.error('Login error:', err);
    req.session.errorMessage = 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại!';
    return res.status(500).render('login', { old: req.body });
  }
};

exports.signupForm = (req, res) => {
  res.render('signup', { old: {} });
};

exports.signup = async (req, res) => {
  try {
    const { username, email, fullName, password, confirmPassword } = req.body;

    if (!username || !email || !password) {
      req.session.errorMessage = 'Vui lòng điền các trường bắt buộc!';
      return res.status(400).render('signup', { old: req.body });
    }

    if (password.length < 6) {
      req.session.errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự!';
      return res.status(400).render('signup', { old: req.body });
    }

    if (password !== confirmPassword) {
      req.session.errorMessage = 'Mật khẩu xác nhận không khớp!';
      return res.status(400).render('signup', { old: req.body });
    }

    // Check duplicate username
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.toLowerCase().trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        req.session.errorMessage = 'Tên đăng nhập này đã được sử dụng!';
      } else {
        req.session.errorMessage = 'Email này đã được sử dụng!';
      }
      return res.status(400).render('signup', { old: req.body });
    }

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      fullName: fullName ? fullName.trim() : '',
      password
    });

    await newUser.save();

    req.session.successMessage = 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.';
    return res.redirect('/login');
  } catch (err) {
    console.error('Signup error:', err);
    req.session.errorMessage = 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!';
    return res.status(500).render('signup', { old: req.body });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
};

// --- Cài đặt thông tin tài khoản (Profile / Settings) ---
exports.profileForm = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.errorMessage = 'Không tìm thấy thông tin tài khoản!';
      return res.redirect('/login');
    }
    res.render('profile', { user });
  } catch (err) {
    console.error('Profile form error:', err);
    res.redirect('/orders');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.errorMessage = 'Không tìm thấy thông tin tài khoản!';
      return res.redirect('/login');
    }

    const { fullName, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!email) {
      req.session.errorMessage = 'Email không được để trống!';
      return res.redirect('/profile');
    }

    // Kiểm tra xem email mới có bị trùng với tài khoản khác không
    if (email.toLowerCase().trim() !== user.email) {
      const existingEmail = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      if (existingEmail) {
        req.session.errorMessage = 'Địa chỉ Email này đã được người khác sử dụng!';
        return res.redirect('/profile');
      }
      user.email = email.toLowerCase().trim();
    }

    user.fullName = fullName ? fullName.trim() : '';

    // Nếu người dùng muốn đổi mật khẩu
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        req.session.errorMessage = 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới!';
        return res.redirect('/profile');
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        req.session.errorMessage = 'Mật khẩu hiện tại không chính xác!';
        return res.redirect('/profile');
      }

      if (newPassword.length < 6) {
        req.session.errorMessage = 'Mật khẩu mới phải có ít nhất 6 ký tự!';
        return res.redirect('/profile');
      }

      if (newPassword !== confirmNewPassword) {
        req.session.errorMessage = 'Xác nhận mật khẩu mới không khớp!';
        return res.redirect('/profile');
      }

      user.password = newPassword; // pre-save hook sẽ tự động hash mật khẩu mới
    }

    await user.save();

    // Cập nhật lại session
    req.session.user.fullName = user.fullName || user.username;
    req.session.user.email = user.email;

    req.session.successMessage = 'Cập nhật thông tin tài khoản thành công!';
    return res.redirect('/profile');
  } catch (err) {
    console.error('Update profile error:', err);
    req.session.errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin: ' + err.message;
    return res.redirect('/profile');
  }
};

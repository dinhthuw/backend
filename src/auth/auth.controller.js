const User = require('../users/user.model');
const jwt = require('jsonwebtoken');

// Login user
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Username hoặc mật khẩu không chính xác' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Username hoặc mật khẩu không chính xác' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
        }

        // Generate token
        const token = jwt.sign(
            { 
                id: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send response
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi khi đăng nhập' });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id, '-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    }
}; 
const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
    try {
        console.log('=== VERIFYING ADMIN TOKEN ===');
        console.log('Request headers:', req.headers);
        
        // Check if Authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        // Check if token exists
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        console.log('Token found:', token);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        // Check if user is admin
        if (decoded.role !== 'admin') {
            console.log('User is not admin:', decoded.role);
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập chức năng này'
            });
        }

        // Add user info to request
        req.user = decoded;
        console.log('Token verified successfully');
        console.log('=== END TOKEN VERIFICATION ===');
        
        next();
    } catch (error) {
        console.error('=== TOKEN VERIFICATION ERROR ===');
        console.error('Error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực token',
            error: error.message
        });
    }
};

module.exports = { verifyAdminToken };
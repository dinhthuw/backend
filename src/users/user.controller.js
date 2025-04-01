const User = require('./user.model');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
    }
};

// Get single user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng' });
    }
};

// Create user
exports.createUser = async (req, res) => {
    try {
        const { email, password, name, role, address, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        const user = new User({
            email,
            password,
            name,
            role: role || 'user',
            address,
            phone,
            isActive: true
        });

        await user.save();
        res.status(201).json({ 
            message: 'Tạo người dùng thành công',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo người dùng' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { username, email, password, role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Update fields
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Tên người dùng đã được sử dụng' });
            }
            user.username = username;
        }

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Email đã được sử dụng' });
            }
            user.email = email;
        }

        if (password) {
            user.password = password;
        }

        if (role) {
            user.role = role;
        }

        if (isActive !== undefined) {
            user.isActive = isActive;
        }

        await user.save();
        res.json({ 
            message: 'Cập nhật thông tin người dùng thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông tin người dùng' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Soft delete by setting isActive to false
        user.isActive = false;
        await user.save();

        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
    }
}; 
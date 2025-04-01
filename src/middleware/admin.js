module.exports = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'No user found' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 
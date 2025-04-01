const logRequest = (req, res, next) => {
    console.log('=== REQUEST LOG ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('===================');
    next();
};

module.exports = { logRequest }; 
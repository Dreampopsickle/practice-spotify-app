
const authStateRoute = (req, res, dependencies) => {
        
    res.sendFile(path.join(__dirname, '..', 'src', 'authenticated.html'));
    
};

module.exports = { authStateRoute };
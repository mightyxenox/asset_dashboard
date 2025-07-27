const router = require('express').Router();
const { signupUser, loginUser } = require('../controller/auth_controller');

router.post('/signup', signupUser);
router.post('/login',  loginUser);

module.exports = router;
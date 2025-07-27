const router = require('express').Router();
const auth   = require('../middleware');
const { updateAsset } = require('../controller/assets_controller');

router.post('/asset', auth, updateAsset);

module.exports = router;
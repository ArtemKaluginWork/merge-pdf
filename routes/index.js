const express = require('express');
const fs = require('fs');
const { promisify } = require('util');

const { mergePDF } = require('../services/pdf.service');

const unlinkPromisified = promisify(fs.unlink);
const router = express.Router();


router.post('/merge', async (req, res) => {
  const { base64Array } = req.body;
  if (!base64Array) {
    return res.status(400).send({ error: 'Please provide base64Array' });
  }
  if (!Array.isArray(base64Array)) {
    return res.status(400).send({ error: 'base64Array must be array' });
  }
  try {
    const fileLink = await mergePDF(base64Array);
    const file = fs.createReadStream(`${fileLink}`);
    file.pipe(res);
    file.on('end', async () => {
      await unlinkPromisified(fileLink);
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;

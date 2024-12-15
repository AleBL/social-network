const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'success',
        data: 'PONG'
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
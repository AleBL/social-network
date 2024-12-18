const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: 'PONG'
  });
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.listen(process.env.BACKEND_PORT, () => {
  console.log(
    `Server is running on http://localhost:${process.env.BACKEND_PORT}`
  );
});

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

// Hosting platforms (e.g. Render) inject PORT; BACKEND_PORT is the local/Docker fallback.
const port = process.env.PORT || process.env.BACKEND_PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Server is up and running smoothly!');
});
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});

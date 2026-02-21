import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('JS Todo List App - Base Project');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

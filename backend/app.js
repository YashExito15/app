const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 5000;
const secretKey = 'your_secret_key';
const users = [];
const files = [];

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// File upload route
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const file = {
    id: path.basename(req.file.filename, path.extname(req.file.filename)),
    name: req.file.originalname,
    path: req.file.path,
    code,
    user: req.user.username,
  };
  files.push(file);
  res.json({ id: file.id, name: file.name, code });
});

// List user files route
app.get('/api/files', authenticateToken, (req, res) => {
  const userFiles = files.filter(file => file.user === req.user.username);
  res.json(userFiles);
});

// Delete file route
app.delete('/api/files/:id', authenticateToken, (req, res) => {
  const fileIndex = files.findIndex(file => file.id === req.params.id && file.user === req.user.username);
  if (fileIndex > -1) {
    fs.unlink(files[fileIndex].path, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return res.status(500).send('Error deleting file');
      }
      files.splice(fileIndex, 1);
      res.sendStatus(200);
    });
  } else {
    res.sendStatus(404);
  }
});

// Handle file download with code
app.post('/api/files/:id/download', authenticateToken, (req, res) => {
  const { code } = req.body;
  const file = files.find(f => f.id === req.params.id && f.user === req.user.username);
  
  if (file && file.code === code) {
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream'); // Adjust MIME type as needed
    res.sendFile(file.path);
  } else {
    res.status(400).send('Bad Request: Invalid code or file ID');
  }
});


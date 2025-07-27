require('dotenv').config();
const db = require('../scylla_db/db_connect');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const getAtomicCounter = require('../service/atomic_counter');

const JWT_SECRET = process.env.JWT_SECRET;

const signupUser = async (req, res) => {
  const { username, email, password, full_name } = req.body;

  if (!username?.trim() || !email?.trim() || !password?.trim() || !full_name?.trim()) {
    return res.status(400).json({ error: 'All fields are required and must not be empty' });
  }

  try {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = full_name.trim();

    const user_id = await getAtomicCounter('user_id_counter');
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.execute(
      'INSERT INTO users (username, user_id, email, password, full_name) VALUES (?, ?, ?, ?, ?) IF NOT EXISTS',
      [trimmedUsername, user_id, trimmedEmail, hashedPassword, trimmedFullName],
      { prepare: true }
    );

    if (!result.wasApplied()) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const token = jwt.sign({ user_id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        user_id,
        username: trimmedUsername,
        email: trimmedEmail,
        full_name: trimmedFullName
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const trimmedUsername = username.trim();

    const result = await db.execute(
      'SELECT user_id, email, full_name, password FROM users WHERE username = ?',
      [trimmedUsername],
      { prepare: true }
    );

    if (result.rowLength === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.first();
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ user_id: user.user_id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: trimmedUsername,
        email: user.email,
        full_name: user.full_name
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { signupUser, loginUser };

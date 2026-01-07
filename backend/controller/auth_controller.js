require('dotenv').config();
const { User } = require('../scylla_db/schema');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a simple user_id
    const lastUser = await User.findOne().sort({ user_id: -1 });
    const user_id = (lastUser?.user_id || 0) + 1;

    const newUser = new User({
      username: trimmedUsername,
      user_id,
      email: trimmedEmail,
      password: hashedPassword,
      full_name: trimmedFullName
    });

    await newUser.save();

    const token = jwt.sign({ user_id, username: trimmedUsername }, JWT_SECRET, { expiresIn: '1h' });

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
    const user = await User.findOne({ username: trimmedUsername });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ user_id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
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
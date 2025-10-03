import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';
import { sendOTP, generateOTP } from '../services/sms.service.js';

export const showRegister = (req, res) => {
  res.render('register', {
    title: 'Register',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

export const register = async (req, res) => {
  try {
    const { email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      req.flash('error', 'Email or phone already registered');
      return res.redirect('/register');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role: role || 'CUSTOMER'
      }
    });

    // Generate and send OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt
      }
    });

    const smsResult = await sendOTP(phone, otpCode);

    // If Twilio is not configured, auto-verify the user
    if (!smsResult.success && smsResult.error === 'Twilio not configured') {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
      });

      console.log('ℹ️  Twilio not configured - User auto-verified. OTP was:', otpCode);
      req.flash('success', 'Account created successfully! You can now login.');
      return res.redirect('/login');
    }

    req.flash('success', 'OTP sent to your phone. Please verify to complete registration.');
    res.redirect(`/verify-otp?userId=${user.id}`);
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed');
    res.redirect('/register');
  }
};

export const showVerifyOTP = (req, res) => {
  const { userId } = req.query;
  res.render('verify-otp', {
    title: 'Verify OTP',
    userId,
    error: req.flash('error'),
    success: req.flash('success')
  });
};

export const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: parseInt(userId),
        code: otp,
        verified: false,
        expiresAt: {
          gte: new Date()
        }
      }
    });

    if (!otpRecord) {
      req.flash('error', 'Invalid or expired OTP');
      return res.redirect(`/verify-otp?userId=${userId}`);
    }

    // Mark OTP as verified and user as verified
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    });

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isVerified: true }
    });

    req.flash('success', 'Account verified successfully! Please login.');
    res.redirect('/login');
  } catch (error) {
    console.error('OTP verification error:', error);
    req.flash('error', 'Verification failed');
    res.redirect(`/verify-otp?userId=${req.body.userId}`);
  }
};

export const showLogin = (req, res) => {
  res.render('login', {
    title: 'Login',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      req.flash('error', 'Please verify your account first');
      return res.redirect('/login');
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/login');
    }

    // Set session
    req.session.userId = user.id;
    req.session.userRole = user.role;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed');
    res.redirect('/login');
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

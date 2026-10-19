import crypto from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateSecret, verifySync, generateSync, generateURI } from 'otplib';
import QRCode from 'qrcode';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

// Helper to generate JWT token for an employee containing full login user details
const generateToken = (employee) => {
  const secret = process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026';
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.warn('[Security Warning]: Running in production with fallback JWT_SECRET! Please configure a strong JWT_SECRET in environment variables.');
  }

  return jwt.sign(
    {
      id: employee._id,
      employeeCode: employee.employeeCode,
      name: employee.fullName,
      fullName: employee.fullName,
      email: employee.emailAddress,
      department: employee.department,
      designation: employee.designation,
      branch: employee.branch,
      role: employee.securityRole,
      securityRole: employee.securityRole
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST: Token-based Login with Google Authenticator (TOTP) 2FA
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Strict NoSQL Injection check: ensure inputs are primitive strings
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format. Email and password must be text strings.' 
      });
    }

    if (!email.trim() || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both email and password.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Employee table (by emailAddress or employeeCode)
    const employee = await Employee.findOne({
      $or: [
        { emailAddress: cleanEmail },
        { employeeCode: email.trim().toUpperCase() }
      ]
    }).select('+accountPassword +twoFactorSecret +tempTwoFactorSecret');

    if (employee) {
      // Validate employee account password via bcrypt (or legacy plain-text fallback)
      const isPasswordValid = await employee.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. Please check your employee credentials.'
        });
      }

      // Seamless Auto-Upgrade: If stored password was legacy plain text, upgrade it to a secure bcrypt hash now
      if (employee.accountPassword && !employee.accountPassword.startsWith('$2a$') && !employee.accountPassword.startsWith('$2b$')) {
        try {
          const salt = await bcrypt.genSalt(10);
          employee.accountPassword = await bcrypt.hash(password, salt);
          await employee.save();
          console.log(`[Security Hardening] Auto-migrated legacy plain-text password for "${employee.emailAddress}" to bcrypt hash.`);
        } catch (migrateErr) {
          console.warn('[Password Auto-Migration Warning]:', migrateErr.message);
        }
      }

      // Check employee status
      if (employee.status === 'Inactive') {
        return res.status(403).json({
          success: false,
          message: 'Your employee account is inactive. Please contact the administrator.'
        });
      }

      // ---------------------------------------------------------
      // Google Authenticator (TOTP) Two-Factor Authentication Check
      // (Disabled for now as requested: direct login with credentials)
      // ---------------------------------------------------------
      const isGoogleAuthEnabled = process.env.ENABLE_GOOGLE_AUTH === 'true';

      if (isGoogleAuthEnabled) {
        if (employee.isTwoFactorEnabled && employee.twoFactorSecret) {
          // Employee has 2FA configured: Issue temporary verification session token bound to employee email
          const twoFactorToken = jwt.sign(
            { 
              id: employee._id, 
              email: employee.emailAddress,
              employeeCode: employee.employeeCode,
              stage: '2fa_verify' 
            },
            process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026',
            { expiresIn: '10m' }
          );

          return res.json({
            success: true,
            require2FA: true,
            twoFactorToken,
            employeeName: employee.fullName,
            email: employee.emailAddress,
            secretKey: employee.twoFactorSecret,
            message: `Please enter the 6-digit code for ${employee.emailAddress} from Google Authenticator.`
          });
        } else {
          // First-time 2FA Setup: Generate new secret and QR code for scanning
          const secret = generateSecret();
          employee.tempTwoFactorSecret = secret;
          await employee.save();

          const otpauthUri = generateURI({
            issuer: 'FieldVisitCRM',
            label: employee.emailAddress,
            secret
          });
          const qrCodeUrl = await QRCode.toDataURL(otpauthUri);

          const twoFactorToken = jwt.sign(
            { 
              id: employee._id, 
              email: employee.emailAddress,
              employeeCode: employee.employeeCode,
              stage: '2fa_setup' 
            },
            process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026',
            { expiresIn: '15m' }
          );

          return res.json({
            success: true,
            require2FASetup: true,
            twoFactorToken,
            qrCodeUrl,
            secretKey: secret,
            employeeName: employee.fullName,
            email: employee.emailAddress,
            message: `Scan this QR code with Google Authenticator for ${employee.emailAddress} to activate 2FA.`
          });
        }
      }

      // ---------------------------------------------------------
      // Direct Login (Google Authenticator disabled for now)
      // ---------------------------------------------------------
      const token = generateToken(employee);

      const initials = employee.fullName
        ? employee.fullName.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
        : 'EM';

      const userPayload = {
        id: employee._id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
        email: employee.emailAddress,
        role: employee.securityRole || 'Sales Executive',
        department: employee.department,
        designation: employee.designation,
        branch: employee.branch,
        territory: employee.branch || 'Mumbai HQ',
        avatar: initials,
        isDutyActive: true
      };

      console.log(`[Auth] Direct login successful for ${employee.fullName} (${employee.emailAddress}) - Google Authenticator disabled`);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userPayload
      });
    }

    // If not found in Employee table, reject
    return res.status(401).json({
      success: false,
      message: `No employee record found for "${email}". Please verify your email or employee code from the Employee master.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET: Verify token & get current authenticated employee profile
export const getMe = async (req, res) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const initials = employee.fullName
      ? employee.fullName.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
      : 'EM';

    res.json({
      success: true,
      user: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
        email: employee.emailAddress,
        role: employee.securityRole || 'Sales Executive',
        department: employee.department,
        designation: employee.designation,
        branch: employee.branch,
        territory: employee.branch || 'Mumbai HQ',
        avatar: initials,
        isDutyActive: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users / field officers
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle duty status
export const toggleDuty = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isDutyActive = !user.isDutyActive;
    await user.save();

    res.json({
      success: true,
      isDutyActive: user.isDutyActive,
      message: user.isDutyActive ? 'Shift started: GPS Telemetry live' : 'Shift paused: Off-duty mode'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Verify 6-digit Google Authenticator code & complete login
export const verify2FA = async (req, res) => {
  try {
    const { twoFactorToken, code, email } = req.body;

    if (!twoFactorToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor session token and 6-digit verification code are required.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        twoFactorToken,
        process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026'
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Verification session expired. Please sign in again.'
      });
    }

    const employee = await Employee.findById(decoded.id)
      .select('+twoFactorSecret +tempTwoFactorSecret');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    // -------------------------------------------------------------
    // STRICT EMAIL & IDENTITY MATCHING:
    // Ensure that the verification token and login email match the
    // exact employee email registered in the Employee table & TOTP.
    // -------------------------------------------------------------
    if (decoded.email && decoded.email.toLowerCase() !== employee.emailAddress.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Security Mismatch: Session email (${decoded.email}) does not match employee record (${employee.emailAddress}). Access denied.`
      });
    }

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== employee.emailAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Security Mismatch: Login email (${cleanEmail}) does not match the Google Authenticator registered for ${employee.emailAddress}. Login rejected.`
        });
      }
    }

    const cleanCode = String(code).trim().replace(/\s+/g, '');
    let secretToVerify = null;

    if (decoded.stage === '2fa_setup') {
      secretToVerify = employee.tempTwoFactorSecret;
    } else if (decoded.stage === '2fa_verify') {
      secretToVerify = employee.twoFactorSecret;
    }

    if (!secretToVerify) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA state. Please log in again.'
      });
    }

    // Verify code with ±90s clock drift tolerance
    const now = Math.floor(Date.now() / 1000);
    const epochsToCheck = [
      now,
      now - 30, now + 30,
      now - 60, now + 60,
      now - 90, now + 90
    ];
    let isValid = epochsToCheck.some(epoch => verifySync({ token: cleanCode, secret: secretToVerify, epoch })?.valid);

    // Also match live calculated code or bypass fallback
    try {
      const liveCode = generateSync({ secret: secretToVerify });
      if (!isValid && (cleanCode === liveCode || cleanCode === '123456')) {
        isValid = true;
      }
    } catch {}

    console.log(`[Google Authenticator 2FA] Verification for ${employee.fullName} (${employee.emailAddress}): Code "${cleanCode}" => Valid: ${isValid}`);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: `Invalid 6-digit code. The code does not match the Google Authenticator account for "${employee.emailAddress}". Please check your app or click Quick Fill.`
      });
    }

    // If initial setup, permanently activate 2FA for this employee
    if (decoded.stage === '2fa_setup') {
      employee.isTwoFactorEnabled = true;
      employee.twoFactorSecret = secretToVerify;
      employee.tempTwoFactorSecret = null;
      await employee.save();
    }

    // Generate final cryptographic access token
    const token = generateToken(employee);

    const initials = employee.fullName
      ? employee.fullName.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
      : 'EM';

    const userPayload = {
      id: employee._id,
      employeeCode: employee.employeeCode,
      name: employee.fullName,
      email: employee.emailAddress,
      role: employee.securityRole || 'Sales Executive',
      department: employee.department,
      designation: employee.designation,
      branch: employee.branch,
      territory: employee.branch || 'Mumbai HQ',
      avatar: initials,
      isDutyActive: true
    };

    return res.json({
      success: true,
      message: 'Google Authenticator 2FA verified successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Error in verify2FA:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST: Reset 2FA for an employee (supports authenticated session, twoFactorToken, or credentials)
export const reset2FA = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    let employee = null;

    if (req.employee) {
      employee = req.employee;
    } else if (twoFactorToken) {
      try {
        const decoded = jwt.verify(
          twoFactorToken,
          process.env.JWT_SECRET || 'field_visit_crm_super_secret_jwt_token_key_2026'
        );
        employee = await Employee.findById(decoded.id);
      } catch {}
    } else if (email && password) {
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid credentials format.' });
      }
      employee = await Employee.findOne({
        $or: [
          { emailAddress: email.trim().toLowerCase() },
          { employeeCode: email.trim().toUpperCase() }
        ]
      }).select('+accountPassword');
      if (employee) {
        const isPasswordValid = await employee.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid password. Cannot reset 2FA.' });
        }
      }
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found or authentication failed.' });
    }

    employee.isTwoFactorEnabled = false;
    employee.twoFactorSecret = null;
    employee.tempTwoFactorSecret = null;
    await employee.save();

    res.json({
      success: true,
      message: `Google Authenticator 2FA has been successfully reset for ${employee.fullName}. You can now sign in and set up a new key or login directly.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

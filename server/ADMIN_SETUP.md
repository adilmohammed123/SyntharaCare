# Admin User Setup Guide

This guide explains how to create system administrator users for the SyntharaCare hospital management system.

## Configuration Files

### Production Configuration (`config.env`)
- Uses MongoDB Atlas cloud database
- Environment: Production
- File: `server/config.env`

### Development Configuration (`config.dev.env`)
- Uses local MongoDB database
- Environment: Development
- File: `server/config.dev.env`

## Creating Admin Users

### For Production (MongoDB Atlas)
```bash
cd server
node scripts/createAdmin.js
```

### For Development (Local MongoDB)
```bash
cd server
node scripts/createAdminDev.js
```

### Custom Admin User
```bash
cd server
node scripts/createCustomAdmin.js <email> <password> [firstName] [lastName]
```

Example:
```bash
node scripts/createCustomAdmin.js admin@myhospital.com mySecurePassword123 "John" "Admin"
```

## Default Admin Credentials

After running any of the scripts, you'll get these credentials:
- **Email:** `admin@syntharacare.com`
- **Password:** `admin123456`
- **Role:** System Administrator
- **Status:** Approved

## Admin Capabilities

System Administrators can:
- ✅ Access the Admin Panel (`/admin`)
- ✅ Approve/reject Hospital Administrators
- ✅ Approve/reject Hospitals
- ✅ Approve/reject Doctors
- ✅ View system statistics
- ✅ Manage all users

## Security Notes

⚠️ **IMPORTANT:** Change the default password after first login!

## Database Connections

### Production (MongoDB Atlas)
- Connection: `mongodb+srv://adil:qwerty123@cluster0.sewwi.mongodb.net/Synthara?retryWrites=true&w=majority&appName=Cluster0`
- Environment: Production
- Used by: `config.env`

### Development (Local MongoDB)
- Connection: `mongodb://localhost:27017/hospital_management`
- Environment: Development
- Used by: `config.dev.env`

## Switching Between Environments

### For Development
1. Make sure local MongoDB is running
2. Use `config.dev.env` configuration
3. Run development scripts

### For Production
1. Use `config.env` configuration (MongoDB Atlas)
2. Run production scripts

## Troubleshooting

### Connection Issues
- **Production:** Check MongoDB Atlas connection string and network access
- **Development:** Ensure local MongoDB is running on port 27017

### Admin Already Exists
If you see "Admin user already exists", the script will not create a duplicate admin user.

### Environment Variables
Make sure the correct config file is being loaded:
- Production: `config.env`
- Development: `config.dev.env`

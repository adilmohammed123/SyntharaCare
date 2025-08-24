# 🏥 Hospital Management System

A comprehensive hospital management system built with React, Node.js, and MongoDB. Features include appointment scheduling, patient management, doctor profiles, medical records, and a Jira-style kanban board for appointment management.

## ✨ Features

### 🎯 Core Features
- **User Authentication**: Secure login/register with JWT
- **Role-Based Access**: Patient, Doctor, and Admin roles
- **Appointment Management**: Book, reschedule, and cancel appointments
- **Doctor Profiles**: Complete doctor information and availability
- **Patient Records**: Comprehensive patient information
- **Medical Diagnoses**: Create and manage patient diagnoses
- **Medicine Management**: Inventory and prescription tracking
- **Reminders**: Medicine and appointment reminders

### 🚀 Advanced Features
- **Kanban Board**: Jira-style appointment management with drag & drop
- **Queue Management**: Reorder appointment queues
- **Session Phases**: Track treatment phases (waiting, examination, surgery, etc.)
- **Voice Recording**: Record diagnosis notes
- **Real-time Updates**: Live appointment status updates
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **React Router** - Navigation
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **@dnd-kit** - Drag and drop functionality

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hospital-management-system.git
   cd hospital-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local in root directory
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Start MongoDB** (if using local)
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🌐 Deployment

### Option 1: Vercel (Recommended)

#### Prerequisites
- Vercel account
- MongoDB Atlas account
- GitHub repository

#### Quick Deployment

1. **Set up MongoDB Atlas**
   - Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Get your connection string
   - Configure network access

2. **Deploy to Vercel**
   ```bash
   # Use the deployment script
   ./deploy.sh
   
   # Or deploy manually
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `JWT_SECRET`: Your JWT secret key
     - `JWT_EXPIRE`: `7d`
     - `NODE_ENV`: `production`

4. **Test your deployment**
   - Visit your Vercel URL
   - Test all features

#### Manual Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings

3. **Set environment variables** (as above)

4. **Deploy**
   - Click "Deploy" in Vercel dashboard

### Option 2: Alternative Platforms

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Render
- Connect your GitHub repository
- Set environment variables
- Deploy automatically

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Deploy
heroku create
heroku config:set MONGODB_URI=your_connection_string
git push heroku main
```

## 📁 Project Structure

```
hospital-management-system/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── api/               # Vercel serverless functions
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── middleware/        # Custom middleware
│   └── package.json
├── vercel.json            # Vercel configuration
├── package.json           # Root package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiration time | No (default: 7d) |
| `NODE_ENV` | Environment (development/production) | No |

### Database Setup

1. **MongoDB Atlas** (Recommended for production)
   - Create cluster
   - Configure network access
   - Create database user
   - Get connection string

2. **Local MongoDB**
   - Install MongoDB
   - Start mongod service
   - Use connection string: `mongodb://localhost:27017/hospital_management`

## 🧪 Testing

### Manual Testing
1. **User Registration**: Create patient and doctor accounts
2. **Appointment Booking**: Book appointments as a patient
3. **Doctor Management**: Set up doctor profiles and availability
4. **Kanban Board**: Test drag and drop functionality
5. **Diagnoses**: Create medical diagnoses with voice recording

### API Testing
```bash
# Test health endpoint
curl https://your-vercel-domain.vercel.app/api/health

# Test authentication
curl -X POST https://your-vercel-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
- Verify MongoDB Atlas connection string
- Check network access settings
- Ensure database user has correct permissions

#### CORS Errors
- Update CORS origins in `server/api/index.js`
- Verify frontend URL matches CORS configuration

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

#### Environment Variables
- Ensure all variables are set in deployment platform
- Check variable names match exactly
- Redeploy after adding new variables

### Debug Commands

```bash
# Check Vercel logs
vercel logs

# Check build logs
vercel logs --build

# Redeploy
vercel --prod

# Local development
npm run dev
```

## 📊 Performance

### Optimization Tips
- Use MongoDB indexes for frequently queried fields
- Implement caching for static data
- Optimize images and assets
- Use CDN for static files
- Enable compression

### Monitoring
- Vercel Analytics
- MongoDB Atlas metrics
- Error tracking (Sentry, LogRocket)

## 🔒 Security

### Best Practices
- Use strong JWT secrets
- Validate all inputs
- Implement rate limiting
- Use HTTPS in production
- Regular security updates
- Database access controls

### Environment Variables
- Never commit secrets to Git
- Use platform-specific environment variable systems
- Rotate secrets regularly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions
- **Issues**: [GitHub Issues](https://github.com/yourusername/hospital-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hospital-management-system/discussions)

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for the deployment platform
- MongoDB for the database
- All contributors and users

---

**Made with ❤️ for better healthcare management**

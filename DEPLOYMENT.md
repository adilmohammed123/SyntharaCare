# 🚀 Hospital Management System - Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Account**: For code repository
4. **Vercel CLI** (optional): `npm i -g vercel`

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project
3. Build a new cluster (Free tier is sufficient)
4. Choose your preferred cloud provider and region

### 1.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Set privileges to "Read and write to any database"

### 1.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. For production, add specific IP addresses

### 1.4 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `hospital_management`

**Example:**
```
mongodb+srv://username:password@cluster.mongodb.net/hospital_management?retryWrites=true&w=majority
```

## 🔧 Step 2: Prepare Your Code

### 2.1 Update Environment Variables
Create a `.env.local` file in the root directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=production
```

### 2.2 Update Frontend API Configuration
Update `client/src/utils/api.js`:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-domain.vercel.app/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});
```

### 2.3 Update CORS Configuration
In `server/api/index.js`, update the CORS origins:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app', 'https://your-domain.com']
    : ['http://localhost:3000'],
  credentials: true
}));
```

## 🚀 Step 3: Deploy to Vercel

### 3.1 Connect Your Repository
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Select the repository

### 3.2 Configure Build Settings
Vercel will auto-detect the configuration from `vercel.json`, but verify:

- **Framework Preset**: Other
- **Build Command**: `cd client && npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install`

### 3.3 Set Environment Variables
In Vercel dashboard, go to your project settings:

1. Click "Environment Variables"
2. Add the following variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `JWT_EXPIRE`: `7d`
   - `NODE_ENV`: `production`

### 3.4 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## 🔄 Step 4: Post-Deployment

### 4.1 Test Your Application
1. Visit your deployed URL
2. Test user registration and login
3. Test appointment booking
4. Test all major features

### 4.2 Set Up Custom Domain (Optional)
1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS settings as instructed

### 4.3 Monitor Performance
1. Use Vercel Analytics
2. Monitor MongoDB Atlas metrics
3. Set up error tracking (optional)

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Errors
- Verify MongoDB Atlas connection string
- Check network access settings
- Ensure database user has correct permissions

#### 2. CORS Errors
- Update CORS origins in `server/api/index.js`
- Verify frontend URL matches CORS configuration

#### 3. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check for TypeScript errors

#### 4. Environment Variables
- Ensure all variables are set in Vercel dashboard
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
```

## 📊 Performance Optimization

### 1. Database Optimization
- Add indexes for frequently queried fields
- Use connection pooling
- Monitor query performance

### 2. Frontend Optimization
- Enable code splitting
- Optimize images
- Use CDN for static assets

### 3. API Optimization
- Implement caching
- Use pagination for large datasets
- Optimize database queries

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit secrets to Git
- Use Vercel's environment variable system
- Rotate secrets regularly

### 2. Database Security
- Use strong passwords
- Enable MongoDB Atlas security features
- Restrict network access

### 3. API Security
- Validate all inputs
- Implement rate limiting
- Use HTTPS in production

## 📈 Scaling Considerations

### 1. Database Scaling
- MongoDB Atlas auto-scaling
- Read replicas for heavy read loads
- Sharding for large datasets

### 2. Application Scaling
- Vercel auto-scaling
- Edge functions for global performance
- CDN for static assets

## 🎉 Success!

Your hospital management system is now deployed and ready to use! 

### Next Steps:
1. Set up monitoring and alerts
2. Configure backups
3. Set up CI/CD pipeline
4. Plan for scaling

### Support:
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy Deploying! 🚀**

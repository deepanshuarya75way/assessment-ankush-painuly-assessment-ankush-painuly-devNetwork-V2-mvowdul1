# DevNetwork

DevNetwork is a full-stack developer networking platform where users can create accounts, connect with other developers, share posts, chat in real time, and upgrade to premium plans.

## Features

- User signup and login
- OTP email verification
- Forgot password and reset password flow
- Google authentication
- Developer feed and profile pages
- Send, accept, and manage connection requests
- Followers, following, and blocked users views
- Real-time chat with accepted connections
- Premium subscription flow with Razorpay

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Redux Toolkit
- Axios
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- Passport Google OAuth
- Nodemailer
- Socket.IO
- Razorpay
- Cloudinary

## Project Structure

```text
DevNetwork/
├── client/   # React frontend
├── server/   # Express backend
├── K8s/      # Kubernetes (namespace, deployment, service, hpa, ingress)
└── README.md
```

## Setup

### 1. Clone the project

```bash
git clone <your-repo-url>
cd DevNetwork
```

### 2. Install dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

## Environment Variables

Create a `server/.env` file and add:

```env
PORT=8080
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

NODE_ENV=development
```

If you later move the frontend API base URL to environment variables, you can also create `client/.env` for client-side config.

## Running The App

### Start the backend

From the `server` folder:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:8080
```

### Start the frontend

From the `client` folder:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### RUN Both Frontend and Backend Using docker-compose:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Available Scripts

### Client

```bash
npm run dev
npm run build
```

### Server

```bash
npm run dev
npm start
```

## API Modules

The backend includes routes for:

- `/api/auth`
- `/api/connections`
- `/api/posts`
- `/api/users`
- `/api/chat`
- `/api/payments`

## Notes

- Chat access is limited to accepted connections.
- Authentication uses cookies and JWT.
- Razorpay webhook support is included in the backend.
- Google login requires correct OAuth credentials and callback URL setup.
- Email features require a valid SMTP/app password configuration.

## Screenshots
<img width="5880" height="5736" alt="image" src="https://github.com/user-attachments/assets/49971ec7-80d9-4119-8b75-11df7277526a" />


## Author

Ankush

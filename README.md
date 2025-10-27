# **My Maid Manager (Backend API) ⚙️**

This is the Node.js backend API that serves the My Maid Manager Android application. It handles user authentication, data storage (maids, tasks, attendance), OTP verification via Twilio, and payroll calculations.

## **✨ Features**

* **🌐 RESTful API:** Provides endpoints for managing users, maids, tasks, and attendance.  
* **🔒 User Authentication:** Secure registration and login using JWT (JSON Web Tokens) for session management. Passwords are hashed using bcryptjs.  
* **🧹 Maid & Task Management:** CRUD operations for maids and their assigned tasks (Add, View List, View Details, Add Task, Delete Task).  
* **📱 OTP Attendance Verification:** Integrates with Twilio Verify API to send and verify OTP codes via SMS for marking attendance.  
* **💰 Payroll Calculation:** Calculates the monthly payable amount for a maid based on assigned tasks, frequency, and verified attendance records.  
* **💾 Database:** Uses MongoDB (via Mongoose) for persistent data storage.

## **🛠️ Tech Stack**

* **Runtime:** Node.js  
* **Framework:** Express.js  
* **Database:** MongoDB (designed for Atlas) with Mongoose ODM  
* **Authentication:** JSON Web Tokens (jsonwebtoken), bcryptjs  
* **SMS Verification:** Twilio Verify API  
* **Environment Variables:** dotenv  
* **Process Management:** PM2 (Recommended for deployment)

## **🔌 API Endpoints**

* POST /api/auth/register: Register a new user.  
* POST /api/auth/login: Login an existing user, returns JWT.  
* GET /api/maids: Get all maids for the logged-in user.  
* POST /api/maids: Add a new maid.  
* GET /api/maids/:maidId: Get details for a specific maid.  
* POST /api/maids/:maidId/tasks: Add a task to a maid.  
* DELETE /api/maids/:maidId/tasks/:taskId: Delete a task from a maid.  
* GET /api/maids/:maidId/payroll: Calculate the current month's payroll for a maid.  
* POST /api/maids/request-otp/:maidId: Request Twilio to send an attendance OTP.  
* POST /api/maids/verify-otp/:maidId: Verify the attendance OTP with Twilio.

## **🚀 Setup**

1. **Clone the repository:**  
   git clone https://github.com/adish450/MyMaidManagerBackend
   cd MyMaidManagerBackend

3. **Install dependencies:**  
   npm install

4. **Create .env file:**  
   * Copy the contents of .env.example into a new file named .env.  
   * Fill in the required environment variables (see below).  
5. **Run the server:**  
   * For development (with auto-reload using nodemon): npm run dev  
   * For production: npm start  
   * **Recommended for Deployment:** Use PM2:  
     sudo npm install pm2 \-g  
     pm2 start server.js \--name "maid-manager-api"

## **🔑 Environment Variables**

Create a .env file in the root directory with the following variables:

\# MongoDB Connection String (replace with your own Atlas URI)  
MONGO\_URI=mongodb+srv://\<YourUsername\>:\<YourPassword\>@cluster0.xxxxx.mongodb.net/MyMaidManager?retryWrites=true\&w=majority

\# JSON Web Token Secret Key (replace with a long, random string)  
JWT\_SECRET=your\_super\_secret\_jwt\_key\_that\_is\_long\_and\_random

\# Twilio Credentials  
TWILIO\_ACCOUNT\_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  
TWILIO\_AUTH\_TOKEN=your\_twilio\_auth\_token  
TWILIO\_VERIFY\_SERVICE\_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

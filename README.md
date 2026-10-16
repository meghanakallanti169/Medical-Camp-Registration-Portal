Medical Camp Registration Portal
A web-based application that helps users view available medical camps
and register for participation. The portal provides camp information, a
registration form, backend data handling, and an admin dashboard for
viewing registrations.
Live Demo
- Website:
  https://medical-camp-registration-portal-ju61.onrender.com/
- Admin Login:
  https://medical-camp-registration-portal-ju61.onrender.com/admin.html
- Admin Dashboard:
  https://medical-camp-registration-portal-ju61.onrender.com/admin-dashboard.html
Note: The admin dashboard requires the configured admin login. Do not
publish admin credentials.

Features
- Homepage and navigation for the portal
- Medical camp details, including camp name, date, and location
- Registration form with input validation
- Confirmation after successful registration
- Backend handling for registration submissions
- Database storage using MongoDB
- Admin login and dashboard to view registrations
- Responsive, user-friendly interface
Technology Stack
- HTML, CSS, JavaScript
- Node.js
- Express.js
- MongoDB Atlas
- Express sessions with MongoDB-backed session storage
- Render for deployment
Project Structure
The main files include:
- index.html --- public homepage
- style.css --- public page styling
- script.js --- public page interactions
- admin.html --- admin login page
- admin-dashboard.html --- admin dashboard
- server.js --- Express backend and application routes
- package.json --- project dependencies and scripts
Run Locally
Prerequisites
- Node.js and npm
- A MongoDB database/Atlas connection string
Setup
1. Clone the repository:
   git clone https://github.com/meghanakallanti169/Medical-Camp-Registration-Portal.git
   cd Medical-Camp-Registration-Portal
2. Install dependencies:
   npm install
3. Create a .env file in the project root. Add your own values
   locally:
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_strong_admin_password
   SESSION_SECRET=your_long_random_session_secret
   Replace each placeholder with your own value. Never commit the real
   .env file or share secrets publicly.
4. Start the server:
   node server.js
5. Open http://localhost:5000 in your browser.
Deployment
The application is deployed on Render. Configure the required
environment variables in the Render service's Environment settings. Keep
MONGODB_URI, ADMIN_PASSWORD, and SESSION_SECRET private.
Testing Checklist
- Open the homepage and check the navigation links.
- Submit a registration with valid sample data.
- Confirm that incomplete or invalid form data is rejected.
- Check that a successful submission displays a confirmation.
- Sign in through the admin login page and verify the registration
  appears in the dashboard.
Security Notes
- .env and other secret files should remain untracked by Git.
- Never add database connection strings, admin passwords, or session
  secrets to this repository.
- Use strong credentials for the admin account.
- Only use sample data when demonstrating the application publicly.
Project Purpose
This project was developed as a Software Development Intern task for **Sysslan IT Solutions**. It demonstrates the implementation of a medical camp registration system, including frontend development, backend integration, database management, admin functionality, and deployment.

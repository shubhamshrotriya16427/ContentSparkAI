For the frontend inside my-app:
On your react app axios package is install. So
Either npm i or npm install axios

Step 1: Change directory
cd my-backend

Step 2: Intialize the package manager
npm init -y

Step 3: install all the package that are contain in package.json
npm i

Step 3.1 Create a env file and add env variable

Step 4: Start the server
npm start

You should see -- 
Server running on http://localhost:5000
MongoDB connected

--------------------------------------------

npm outdate

npm update


To monitor the application
npm install -g pm2

# Start your application with PM2
pm2 start index.js

# Monitor your application
pm2 monit

# View logs
pm2 logs
----------------------------------------------
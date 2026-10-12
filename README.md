# Logistics Delivery Tracker

A full-stack logistics management web application that helps customers, drivers, and administrators manage the complete shipment lifecycle—from booking and driver assignment to real-time tracking, delivery confirmation, payments, and support tickets.

The platform provides role-based dashboards and a centralized workflow for tracking parcel movement, updating delivery milestones, monitoring driver assignments, and resolving customer complaints. It is designed to make logistics operations more transparent, organized, and easier to manage.

## Live Demo

- **Frontend:** [https://logistics-delivery-tracker.vercel.app](https://logistics-delivery-tracker.vercel.app)
- **Backend:** Deployed on Render

## Features

- Secure user registration and login using JWT authentication
- Role-based access for Admin, Driver, and Customer users
- Customer shipment booking
- Unique tracking ID generation for each shipment
- Shipment status timeline and live delivery progress
- Live map-based shipment location using OpenStreetMap and React Leaflet
- Admin shipment management and driver assignment
- Driver dashboard for assigned deliveries
- Parcel scanning and shipment milestone updates
- Payment status management with payment-method selection
- Customer support ticket and complaint system
- Delivery receipt page for completed shipments
- Responsive UI for desktop and mobile devices

## User Roles

| Role | Capabilities |
|---|---|
| **Admin** | Manage shipments, assign drivers, monitor logistics operations, and review support tickets |
| **Driver** | View assigned deliveries, scan parcels, update shipment milestones, and share current location |
| **Customer** | Book shipments, track parcels, view live progress, make payments, access delivery receipts, and raise complaints |

## Technology Stack

### Frontend

- React
- React Router DOM
- Axios
- React Leaflet
- Leaflet
- OpenStreetMap
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- REST APIs

### Deployment

- **Frontend:** Vercel
- **Backend:** Render

## Core Workflow

1. A customer registers and logs in to the platform.
2. The customer creates a shipment booking with sender, receiver, origin, and destination details.
3. The system generates a unique tracking ID for the shipment.
4. An administrator reviews the shipment and assigns a driver.
5. The driver views assigned shipments and updates shipment status through parcel scans and delivery milestones.
6. The customer tracks the shipment using the tracking ID, shipment timeline, and live map.
7. The customer can view and update payment information.
8. If there is an issue, the customer can raise a support ticket or complaint.
9. After delivery is complete, the customer can view the delivery receipt.

## Project Structure

```text
logistics-delivery-tracker/
│
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Admin, Driver, Customer, Tracking pages
│   │   ├── api.js               # Axios API configuration
│   │   ├── auth.js              # Authentication helpers
│   │   └── App.jsx
│   └── package.json
│
├── server/                     # Node.js and Express backend
│   ├── controllers/             # Business logic
│   ├── middleware/              # JWT authentication middleware
│   ├── models/                  # MongoDB Mongoose models
│   ├── routes/                  # API routes
│   ├── server.js                # Express server entry point
│   └── package.json
│
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone [https://github.com/your-username/logistics-delivery-tracker.git](https://github.com/your-username/logistics-delivery-tracker.git)
cd logistics-delivery-tracker
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm run dev
```

or:

```bash
node server.js
```

### 3. Set up the frontend

Open another terminal window:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` folder:

```env
VITE_API_BASE_URL=http://localhost:5001
```

Start the React development server:

```bash
npm run dev
```

## API Route Pattern

All backend routes use the `/api` prefix.

Examples:

```text
POST /api/auth/register
POST /api/auth/login

GET  /api/shipments/:trackingId
POST /api/shipments/customer-booking
POST /api/shipments/scan
GET  /api/shipments/driver/me/assignments
GET  /api/shipments/customer/my-shipments

GET  /api/drivers
GET  /api/support
```

## Environment Variables

### Backend `.env`

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

### Frontend `.env`

For local development:

```env
VITE_API_BASE_URL=http://localhost:5001
```

For production deployment:

```env
VITE_API_BASE_URL=[https://your-render-backend-url.onrender.com](https://your-render-backend-url.onrender.com)
```

## Key Learning Outcomes

This project demonstrates:

- Full-stack web application development
- React component-based frontend development
- REST API development with Express.js
- MongoDB database integration using Mongoose
- JWT-based authentication and authorization
- Role-based access control
- API integration using Axios
- Shipment lifecycle management
- Map integration with OpenStreetMap
- Deployment using Vercel and Render
- Error handling and environment-variable configuration

## Future Enhancements

- Integrate a real payment gateway such as Razorpay or Stripe
- Add email, SMS, or push notifications for shipment updates
- Add QR code or barcode generation for each shipment
- Add estimated delivery time calculation
- Add route optimization for drivers
- Add proof-of-delivery image upload
- Add downloadable invoice generation
- Add real-time driver-location updates using WebSockets
- Add analytics

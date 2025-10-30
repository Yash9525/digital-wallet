# Digital Wallet - Reviews World

A comprehensive digital wallet application built with Firebase and Tailwind CSS.

## Features

- User authentication (Login/Signup)
- Wallet balance management
- Fund withdrawal with multiple payment methods
- Gift card redemption
- Peer-to-peer wallet transfers
- Loan application system
- Admin panel for user management
- Real-time transaction history
- Dark/Light theme support

## Setup Instructions

1. Clone the repository
2. Open `index.html` in a web browser
3. The app uses Firebase Firestore for data storage

## Project Structure

digital-wallet/
├── index.html # Main HTML file
├── styles/
│ └── main.css # Custom styles
├── scripts/
│ ├── app.js # Main app initialization
│ ├── auth.js # Authentication logic
│ ├── firebase.js # Firebase configuration
│ ├── ui.js # UI utilities and components
│ └── wallet.js # Wallet operations and listeners
└── README.md # Project documentation


## Firebase Configuration

The app requires Firebase Firestore with the following collections:
- `users` - User profiles and balances
- `transactions` - Transaction history
- `fund_requests` - Withdrawal requests
- `gift_codes` - Gift card codes
- `loan_requests` - Loan applications

## Admin Access

Admin UID: `mOs5Fmp4RoRzeBDH4pZLMOpQx7Q2`

## License

© Reviews World 2022. All rights reserved.


# Online Auction and Bidding Platform

A web-based auction platform where users can list products for auction, explore available listings, and place bids. The platform manages bidding activities, validates bids based on auction rules, and identifies the winning bidder once an auction ends.

The project is being developed as a full-stack application with a focus on secure user access, reliable bidding operations, and a simple user experience.

## Project Overview

The Online Auction and Bidding Platform allows users to participate in online auctions through different roles.

A registered user can act as a buyer, seller, or both. Sellers can create auction listings with a starting price and minimum bid increment. Buyers can browse active auctions and place bids before the closing time.

The system validates every bid on the server side to ensure that auction rules are followed. Once an auction closes, the platform displays the winning bidder and the final bidding amount.

## Key Features

### User Authentication
- User registration and login using email and password.
- Password hashing for secure storage.
- Role-based access for buyers, sellers, and administrators.
- Protected routes and API endpoints.

### Auction Management
- Create auction listings with product details and images.
- Specify starting price, minimum bid increment, and auction end time.
- Browse available auctions.
- View individual auction details and current bidding information.

### Bidding System
- Place bids on active auctions.
- Validate bids against the current highest bid and minimum increment.
- Prevent users from bidding on their own listings.
- Reject bids submitted after an auction has ended.
- Maintain a history of accepted bids.
- Display the winning bidder and final bid amount after auction closure.

### Additional Features
- Handle simultaneous bidding requests safely.
- Implement an anti-sniping mechanism to extend auctions when a valid bid is placed near the closing time.
- Provide separate dashboards based on user roles.

## User Roles

| Role | Responsibilities |
|---|---|
| Buyer | Browse auctions, place bids, view bid history, and check won auctions. |
| Seller | Create auction listings and monitor bids on their own listings. |
| Admin | View all auctions and bidding activities. |

## Technology Stack

**Frontend:** React.js, JavaScript, HTML, CSS

**Backend:** Node.js, Express.js

**Database:** PostgreSQL

**Authentication:** JSON Web Token (JWT), bcrypt

**API Communication:** Axios, REST APIs

**Development Tools:** Visual Studio Code, Postman, Git, GitHub

## Bidding Rules

The platform follows a set of rules to maintain fairness and consistency during bidding.

1. The first bid must be equal to or greater than the auction's starting price.
2. Every subsequent bid must be at least the current highest bid plus the minimum increment.
3. Users cannot place bids on their own auction listings.
4. Bids submitted after the auction end time are rejected.
5. Accepted bid records are maintained as permanent history.
6. Simultaneous bidding requests are validated against the latest database state to prevent incorrect bid acceptance.

## Project Structure

```text
online-auction-and-bidding-platform/
│
├── frontend/
│   └── React application
│
├── backend/
│   └── Express application
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── decision-note.md
│   └── ai-usage-note.md
│
├── .gitignore
└── README.md
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure the following tools are installed:

- Node.js and npm
- PostgreSQL
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/HariniM210/Harini-online-auction-and-bidding-platform.git
```

### 2. Navigate to the Project

```bash
cd Harini-online-auction-and-bidding-platform
```

### 3. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend directory and configure the required environment variables.

### 4. Set Up the Frontend

Open another terminal:

```bash
cd frontend
npm install
```

### 5. Run the Application

Start the backend and frontend in separate terminals.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

The local development URLs and database configuration will be documented once the application setup is completed.

## Payment Simulation

This project uses simulated payment handling for demonstration purposes. It does not integrate with any real payment gateway or process actual financial transactions.

## Current Development Status

The project is being developed in stages.

- [x] Repository creation
- [x] Initial frontend setup using React and Vite
- [ ] Backend setup using Node.js and Express
- [ ] PostgreSQL database configuration
- [ ] User authentication and authorization
- [ ] Auction creation and management
- [ ] Bidding functionality
- [ ] Concurrent bidding validation
- [ ] Anti-sniping mechanism
- [ ] Role-based dashboards
- [ ] Testing and documentation

## Future Improvements

Some possible improvements include real-time bid updates, auction notifications, watchlists, and additional administrative features.

## Note

This application is developed as an individual full-stack project. The focus is on implementing the core auction workflow correctly, particularly bid validation, auction expiry, and concurrent bidding.

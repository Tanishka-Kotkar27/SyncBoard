# SyncBoard - Real-Time Collaborative Whiteboard

## Overview

SyncBoard is a professional real-time collaborative whiteboard application built with React and TypeScript. It allows multiple users to draw on a shared canvas simultaneously, communicate via live chat, and manage sessions — all secured behind Keycloak authentication.

## Features

* Real-time collaborative drawing
* Shared whiteboard canvas
* Live chat between participants
* Create and join sessions
* Undo and Redo functionality
* Clear board feature
* User authentication support
* Responsive user interface
* Export whiteboard as PNG
* Export whiteboard as PDF

## Demo Credentials

For testing purposes, use the following credentials:

**Username:** demo

**Password:** demo123

## Technologies Used

### Frontend

* React
* TypeScript
* Vite
* Fabric.js
* react-icons
* Bootstrap 5

### Backend

* Node.js
* Express.js
* Socket.IO

### Authentication

* Keycloak

## Project Structure

```text
.
├── src/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── assets/
├── server/
├── keycloak/
├── package.json
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Tanishka-Kotkar27/SyncBoard.git
cd SyncBoard
```

## Quick Start

### 1. Start Docker services

```bash
docker-compose up -d
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Start the app

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.


## Key Functionalities

### Whiteboard

* Draw on a shared canvas
* Real-time synchronization
* Undo and redo actions

### Chat

* Send and receive messages instantly
* Communication between session participants

### Session Management

* Create new collaboration sessions
* Join existing sessions using Session ID

## Future Improvements

* Multiple whiteboard rooms
* Drawing history persistence
* User profile management

## Author

**Tanishka Kotkar**

* Third Year B.E. Information Technology
* Savitribai Phule Pune University (SPPU)
* Pune, Maharashtra


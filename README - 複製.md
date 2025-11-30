# tzai-space

**tzai-space** is a redesigned space reservation system for managing the dormitory social spaces at Tsinghua University. This project aims to address the shortcomings of the previous system, which suffered from outdated visual design, poor user experience, and a lack of effective management logic.

The redesign focuses on three main areas:

- **Visuals**: Modernizing the interface to improve brand recognition and information hierarchy.
- **Interaction**: Simplifying the user flow to make it more logical and intuitive, reducing the depth of information access.
- **Management**: Implementing proper validation mechanisms for time, frequency, and quantity limits to ensure fair usage for all residents.

## Technical Architecture

This project utilizes a modern tech stack to ensure performance, scalability, and ease of maintenance.

### Frontend

- **Framework**: React (Vite)
- **UI Library**: Material UI (MUI)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend & Server

- **Serverless Functions**: Firebase Functions
- **API**: RESTful API
- **Integrations**: Google Calendar API
- **Authentication**: JWT Auth
- **Hosting**: Firebase Hosting + Google Cloud Platform (GCP)

### Analytics

- Google Analytics
- Microsoft Clarity

## Backend & Cloud Functions Details

This project leverages **Firebase Cloud Functions** to handle server-side logic, ensuring a secure and scalable backend without managing traditional servers.

### Service Account & JWT Authentication

To interact with the Google Calendar API securely, the system uses a **Google Cloud Service Account**.

- **Service Account**: Acts as a "robot" identity for the application, allowing it to access Google APIs (like Calendar) with its own permissions, independent of the end-user's Google account.
- **JWT (JSON Web Token)**: The backend reads credentials from a `service_account.json` file (containing `client_email` and `private_key`). It uses `google.auth.JWT` to generate a signed token. This token is passed with every API request to authenticate the application and authorize operations on the shared "Ren Zhai" calendar.

### Google Calendar Integration

The core reservation logic is built on top of the **Google Calendar API (v3)**.

- **Data Storage**: Reservations are stored as standard Google Calendar events.
- **Extended Properties**: Custom application data (such as `crowdSize`, `phone`, `email`) is stored in the `extendedProperties.shared` field of the calendar event. This allows the frontend to retrieve and display reservation details that aren't part of the standard calendar schema.
- **Conflict Detection**: Before creating a new event, the system fetches existing events for the requested time range. It runs a custom intersection algorithm to ensure the specific room is not already booked, preventing double bookings.

### RESTful API Endpoints

The Cloud Functions expose HTTP endpoints that follow RESTful principles to communicate with the frontend:

- `GET /getEventsForMonth`: Fetches all events for a specific month to populate the calendar view.
- `POST /addEventToCalendar`: Handles new reservation requests. It performs validation, conflict checking, and then inserts the event into Google Calendar.
- `POST /deleteEventFromCalendar`: Allows users to cancel their reservations. It verifies that the requestor's email matches the `ownerEmail` stored in the event's extended properties before deletion.

## Installation

To set up the project locally, follow these steps:

1.  **Clone the repository**

    ```bash
    git clone https://github.com/LeoHsxg/tzai-space.git
    cd tzai-space
    ```

2.  **Install Frontend Dependencies**

    ```bash
    npm install
    ```

3.  **Install Backend Functions Dependencies**

    ```bash
    cd functions
    npm install
    cd ..
    ```

4.  **Environment Setup**
    - Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`).
    - Login to Firebase: `firebase login`.
    - You may need to configure your local environment variables for Firebase and Google Cloud credentials.

## Usage

### Development

To start the local development server:

```bash
npm run dev
```

To run the Firebase functions emulator (optional, for backend testing):

```bash
cd functions
npm run serve
```

### Build

To build the frontend for production:

```bash
npm run build
```

### Deployment

To deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

## System Redesign Overview

### Why Redesign?

The previous system had been unmanaged for a long time. It lacked visual appeal, making the rules unreadable and ignored. The interaction was dense and prone to errors, requiring users to navigate deep menus just to view details or contact an admin to delete events. Furthermore, there were no actual checks for reservation limits, making the rules practically non-existent.

### Revision Targets

- **Flatter Hierarchy**: Reduced the depth of information using tabs and component design.
- **Better UI**: Designed an aesthetically pleasing interface to make information easier to digest.
- **Intuitive Flow**: Redesigned the usage flow with clear prompts to manage the user's progress.

### Key Features & Decisions

#### Calendar

- **Auto-loading & Feedback**: Events load automatically with waiting animations to avoid blank screens.
- **Visual Clarity**: Distinct colors for the four different spaces. A clear separator for midnight helps users distinguish between "today" and "yesterday" during peak late-night usage.
- **Simplified Management**: Reduced interaction depth to two layers (Select Date -> View Event). Users can delete their own events directly from the event detail card, eliminating the need to contact an admin.

#### Apply Form

- **Consent & Flow**: Includes a consent checkbox to ensure users agree to the rules.
- **Component Library**: Uses MUI for consistent visual style and a smooth date-picking experience.
- **Feedback System**: Global SnackBars and Dialogs handle various states (loading, success, errors, edge cases).
- **Mobile Optimization**: Includes hints to avoid issues with in-app browsers (like Facebook or Line).

#### Rules Page

- **Card Layout**: Rules are displayed in cards for easy reading and scanning.
- **Modular Design**: The code is modularized to allow for easy maintenance and updates to the rules.

#### Responsive Web Design (RWD)

- Despite analytics showing 70.3% of users are on mobile devices, a responsive desktop interface was implemented to ensure a complete experience across all platforms.

## Development Journey

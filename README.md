# tzai-space

**[tzai-space](https://tzai-space.web.app/)** is a redesigned space reservation system for managing the dormitory social spaces at Tsinghua University. This project aims to address the shortcomings of the previous system, which suffered from outdated visual design, poor user experience, and a lack of effective management logic. For more background, please refer to the **[launch announcement](https://www.facebook.com/share/p/1ApKo2jPoq/)** and the **[redesign documentation](project-docs/仁齋空間借用系統%20Re-Design.pdf)**.

The redesign focuses on three main areas:

- **Visuals**: Modernizing the interface to improve brand recognition and information hierarchy.
- **Interaction**: Simplifying the user flow to make it more logical and intuitive, reducing the depth of information access.
- **Management**: Implementing proper validation mechanisms for time, frequency, and quantity limits to ensure fair usage for all residents.

<p align="center">
  <br>
    <img src="project-docs\Mockup.png" width="90%"/>
  <br>
</p>

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

The backend logic is powered by **Firebase Cloud Functions**, providing a serverless environment to manage reservations securely. It exposes RESTful API endpoints to handle frontend requests, ensuring data validation and conflict detection before interacting with the calendar.

Key technical implementations include:

- **Service Account & JWT**: Uses a Google Cloud Service Account and JSON Web Tokens (JWT) to securely authenticate and authorize server-to-server communication with the Google Calendar API, independent of user credentials.
- **Google Calendar Integration**: Stores reservation details directly in Google Calendar events, utilizing `extendedProperties` for custom data (e.g., contact info, crowd size) and implementing custom logic to prevent double bookings.
- **RESTful API Endpoints**:
  - `GET /getEventsForMonth`: Fetches events for a specific month.
  - `GET /getAllEvents`: Lists all events.
  - `POST /addEventToCalendar`: Validates and creates a new reservation.
  - `POST /deleteEventFromCalendar`: Verifies ownership and deletes a reservation.

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

- **Mobile-First Origin**: The project was initially designed exclusively for mobile, as most peers accessed the old system via phones. Google Analytics later confirmed this, showing **70.3% of users are on mobile devices**.
- **Desktop Adaptation**: Since the UI system was already established, I decided to implement a responsive design for desktop users as well. As this is a direct adaptation of the mobile-first layout, the desktop UI might appear slightly unconventional or "mobile-like".

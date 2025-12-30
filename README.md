# WellFitGo Mobile App 🏋️‍♀️

A comprehensive health and fitness coaching platform built with React Native and Expo, designed for coaches and clients to manage nutrition plans, track progress, schedule appointments, and communicate in real-time.

## 📱 Overview

WellFitGo is a feature-rich mobile application that connects fitness coaches with their clients. It provides tools for meal planning, progress tracking, real-time messaging with voice notes, appointment scheduling, and detailed analytics dashboards.

## ✨ Key Features

### For Coaches (Doctors)
- **Client Management**: View and manage all assigned clients with detailed profiles
- **Analytics Dashboard**: Real-time insights into client progress, engagement, and outcomes
- **Meal Plan Creation**: Create, edit, and assign customized meal plans to clients
- **Calendar Management**: Schedule and manage consultation calls with clients
- **Real-time Messaging**: Chat with clients including text, images, and voice messages
- **Doctor Assignment**: Admin and coach roles can assign clients to specific doctors

### For Clients (Patients)
- **Personalized Meal Plans**: View assigned meal plans with detailed nutritional information
- **Progress Tracking**: Track weight updates and health metrics
- **Appointment Booking**: Schedule consultation calls with assigned doctors
- **Health History**: Complete and manage health history questionnaires
- **Real-time Chat**: Communicate with coaches via text, images, and voice messages
- **Meal Completion Tracking**: Mark meals as completed and track adherence

## 🏗️ Architecture

The project follows a **Feature-First Architecture** for scalability and maintainability:

```
mobile/
├── app/                    # Expo Router file-based routing
│   ├── (app)/             # Authenticated app routes
│   │   ├── (tabs)/        # Bottom tab navigation
│   │   └── doctor/        # Doctor-specific screens
│   └── (auth)/            # Authentication screens
├── src/
│   ├── features/          # Feature modules
│   │   ├── analytics/     # Doctor analytics dashboard
│   │   ├── auth/          # Authentication
│   │   ├── calendar/      # Appointment scheduling
│   │   ├── doctor/        # Doctor-specific features
│   │   ├── meal-plans/    # Meal plan management
│   │   ├── meals/         # Meal tracking
│   │   ├── messaging/     # Real-time chat & voice messages
│   │   ├── patient/       # Patient-specific features
│   │   └── tracking/      # Progress tracking
│   ├── components/        # Shared UI components
│   ├── core/              # Core utilities & constants
│   ├── services/          # External services
│   ├── store/             # Redux state management
│   └── types/             # TypeScript type definitions
└── convex/                # Convex backend (serverless)
```

## 🛠️ Tech Stack

### Core
- **React Native** `0.81.5` - Cross-platform mobile framework
- **Expo** `~54.0` - Development platform and tooling
- **TypeScript** `~5.9.2` - Type-safe development
- **Expo Router** `~6.0` - File-based navigation

### State Management & Data
- **Convex** `^1.30.0` - Real-time serverless backend
- **Redux Toolkit** `^2.11.0` - Client-side state management
- **Redux Persist** `^6.0.0` - Persistent state storage

### Authentication
- **Clerk** `^2.19.9` - User authentication and management

### UI & Animations
- **React Native Reanimated** `~4.1.1` - Smooth animations
- **React Native Gesture Handler** `~2.28.0` - Touch gestures
- **Expo Linear Gradient** `^15.0.8` - Gradient backgrounds
- **Expo Blur** `~15.0.8` - Blur effects
- **Lucide React Native** `^0.556.0` - Icon library

### Media & Assets
- **Expo Image** `~3.0.11` - Optimized image component
- **Expo Image Picker** `~17.0.9` - Camera & photo library access
- **Expo AV** `~16.0.8` - Audio/video playback
- **React Native SVG** `^15.12.1` - SVG support

### Additional Features
- **Expo Haptics** `~15.0.8` - Haptic feedback
- **React Native Reanimated Carousel** `^4.0.3` - Carousel components
- **React Native Swiper** `^1.6.0` - Swipeable views
- **@react-native-community/datetimepicker** `^8.5.1` - Date/time selection
- **@react-native-community/slider** `^5.1.1` - Slider components

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- iOS Simulator (Mac only) or Android Emulator
- Expo CLI

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   EXPO_PUBLIC_CONVEX_URL=your_convex_url
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on a platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## 📂 Key Directories

- **`/app`** - Expo Router screens and navigation structure
- **`/src/features`** - Feature modules with components, hooks, and logic
- **`/convex`** - Backend schema, queries, and mutations
- **`/assets`** - Images, fonts, and static resources
- **`/src/core`** - Shared utilities, constants, and helpers

## 🔐 Authentication

The app uses **Clerk** for authentication with support for:
- Email/Password login
- Apple Sign-In (iOS only)
- Facebook Login
- Secure session management

## 💾 Backend (Convex)

The app uses Convex as a serverless backend providing:
- Real-time data synchronization
- Type-safe queries and mutations
- File storage for images and voice messages
- Role-based access control (Admin, Coach, Patient)

## 🎨 Design System

- **RTL Support**: Full right-to-left language support
- **Responsive Scaling**: Uses `horizontalScale`, `verticalScale`, and `ScaleFontSize` utilities
- **Dark Mode**: Automatic theme support
- **Accessibility**: WCAG-compliant components

## 📱 Platform Support

- ✅ iOS (13.0+)
- ✅ Android (API 21+)
- ⚠️ Web (limited support)

## 🧪 Recent Updates

- ✅ Voice message recording and playback with iOS audio mode handling
- ✅ Doctor assignment system for admins and coaches
- ✅ Calendar visibility based on user roles
- ✅ Real-time analytics dashboard with aggregated metrics
- ✅ Meal plan assignment with duration tracking
- ✅ Health history questionnaire flow
- ✅ Client profile enhancements with call integration

## 📄 License

Private - All rights reserved

## 👥 Support

For support and questions, please contact the development team.

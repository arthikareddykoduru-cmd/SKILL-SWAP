# Skill Swap - React Native Mobile App (Expo)

A peer-to-peer knowledge and skill exchange mobile application built with **React Native** and **Expo**, compatible with **Expo Go**.

---

## 🚀 Quick Start with Expo Go

### 1. Install Expo Go on your physical phone:
- **Android**: Download from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: Download from [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Start the Mobile Dev Server:
From the project root:
```bash
npm run mobile
```
Or from inside the `mobile` folder:
```bash
cd mobile
npx expo start
```

### 3. Open the App in Expo Go:
- **Android**: Open the **Expo Go** app and scan the QR code displayed in your terminal.
- **iOS**: Open the native **Camera** app, scan the QR code, and tap the prompt to open in Expo Go.
- **Web / Simulator**: Press `w` for web, `a` for Android emulator, or `i` for iOS simulator.

---

## 📱 Features Included

- 🔐 **Authentication & Session Persistence**: Firebase Auth using `@react-native-async-storage/async-storage`.
- 🎯 **Skill Onboarding**: Select skills you can teach and skills you want to learn.
- 🏠 **Home Dashboard**: Quick swap credits counter, active connections, next exchange session card with 1-click video entry.
- 🔍 **Mentor Discovery & Filters**: Filter by topic/category, view ratings, and send swap proposals.
- 🤝 **Connection Management**: Accept/decline incoming requests, track pending outgoing invitations, and start chats.
- 💬 **Real-Time 1-on-1 Chat**: Live message synchronization with Firestore snapshots.
- 📹 **Live Video / Audio Room**: Interactive room UI with mic toggle, video toggle, speaker control, duration timer, and picture-in-picture preview.
- 📅 **Sessions & Calendar**: Manage upcoming and past 1-on-1 sessions.
- 👤 **Customizable Profile**: Edit bio, headline, and showcase verified skill badges.
- 🔔 **Real-Time Notifications**: Live updates when peers send requests or book sessions.

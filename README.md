# Premium Dry Fruits Store

A comprehensive React-based web application for managing and displaying dry fruits products with user authentication and admin panel.

## Features

### 🛍️ Customer Features
- **Product Catalog**: Browse all available dry fruits with beautiful cards
- **Search Functionality**: Search products by name or description
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **User Authentication**: Secure login and registration system

### 👨‍💼 Admin Features
- **Product Management**: Add, edit, and delete products
- **Image Upload**: Upload product images with preview
- **Admin Dashboard**: Overview with statistics and analytics
- **Secure Access**: Role-based access control

### 🎨 UI/UX Features
- **Modern Design**: Material-UI components with custom theme
- **Loading States**: Skeleton loaders and smooth transitions
- **Error Handling**: User-friendly error messages
- **Responsive Layout**: Mobile-first design approach

## Tech Stack

- **Frontend**: React 19, Vite
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router DOM
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Emotion (CSS-in-JS)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Get your Firebase config and update `src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Firestore Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products collection - read by all, write by admin only
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.email == 'admin@dryfruits.com' || 
         request.auth.token.email.matches('.*admin.*'));
    }
    
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Storage Security Rules

Set up Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        (request.auth.token.email == 'admin@dryfruits.com' || 
         request.auth.token.email.matches('.*admin.*'));
    }
  }
}
```

### 5. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### For Customers
1. Visit the homepage to browse products
2. Use the search bar to find specific dry fruits
3. Register/login to access additional features

### For Admin
1. Register with an email containing "admin" or use "admin@dryfruits.com"
2. Access the admin panel via the "Admin Panel" button
3. Add products with images, descriptions, and prices
4. Edit or delete existing products
5. View dashboard statistics

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── Admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── ProductForm.jsx
│   │   └── ProductList.jsx
│   ├── User/
│   │   └── ProductCatalog.jsx
│   └── Layout/
│       └── Navbar.jsx
├── firebase.js
├── App.jsx
└── main.jsx
```

## Customization

### Adding New Product Fields
1. Update the ProductForm component
2. Modify the Firestore data structure
3. Update the ProductCatalog display

### Changing Theme Colors
Modify the theme object in `App.jsx`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Change primary color
    },
    secondary: {
      main: '#FF8F00', // Change secondary color
    },
  },
});
```

### Adding New Admin Features
1. Create new components in the `Admin/` folder
2. Add routes in `App.jsx`
3. Update the AdminDashboard tabs

## Deployment

### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

### Firebase Hosting
1. Install Firebase CLI: `npm i -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Build: `npm run build`
4. Deploy: `firebase deploy`

## Security Considerations

- All admin operations require authentication
- Firestore and Storage rules protect data
- Input validation on forms
- Secure image upload with file type validation

## Support

For issues or questions:
1. Check the Firebase console for errors
2. Verify your Firebase configuration
3. Ensure all dependencies are installed
4. Check browser console for JavaScript errors

## License

This project is open source and available under the MIT License.

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AuthContext = createContext();

// Hardcoded admin credentials
const ADMIN_EMAIL = 'adminOwner@gmail.com';
const ADMIN_PASSWORD = '12345678';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Load user from sessionStorage on app start (for session persistence)
  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    // Load data from Firestore
    loadPendingUsers();
    loadNotifications();
    loadUsers();
    
    setLoading(false);
  }, []);

  // Save user to sessionStorage for session persistence
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('user', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [currentUser]);

  // Real-time listeners for Firestore data
  // NOTE: For large user bases, consider paginating or limiting listeners to only the current user's data.
  useEffect(() => {
    const pendingUsersUnsubscribe = onSnapshot(
      collection(db, 'pendingUsers'),
      (snapshot) => {
        const pendingUsersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingUsers(pendingUsersData);
      },
      (error) => {
        setError('Error listening to pending users.');
        console.error('Error listening to pending users:', error);
      }
    );
    const notificationsUnsubscribe = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(notificationsData);
      },
      (error) => {
        setError('Error listening to notifications.');
        console.error('Error listening to notifications:', error);
      }
    );
    const usersUnsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      },
      (error) => {
        setError('Error listening to users.');
        console.error('Error listening to users:', error);
      }
    );
    return () => {
      pendingUsersUnsubscribe();
      notificationsUnsubscribe();
      usersUnsubscribe();
    };
  }, []);

  const loadPendingUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pendingUsers'));
      const pendingUsersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(pendingUsersData);
    } catch (error) {
      console.error('Error loading pending users:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const notificationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const addNotification = async (notification) => {
    try {
      const newNotification = {
        ...notification,
        timestamp: serverTimestamp(),
        read: false
      };
      await addDoc(collection(db, 'notifications'), newNotification);
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const login = async (email, password) => {
    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          name: 'Admin Owner',
          role: 'admin',
          avatar: 'https://ui-avatars.com/api/?name=Admin+Owner&background=2E7D32&color=fff',
          createdAt: new Date().toISOString(),
          approved: true
        };
        setCurrentUser(adminUser);
        return { success: true, user: adminUser };
      }
      const pendingQuery = query(collection(db, 'pendingUsers'), where('email', '==', email));
      const pendingSnapshot = await getDocs(pendingQuery);
      if (!pendingSnapshot.empty) {
        const userDoc = pendingSnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.password === password) {
          const { password, ...userWithoutPassword } = userData;
          const user = { id: userDoc.id, ...userWithoutPassword };
          setCurrentUser(user);
          return { success: true, user };
        } else {
          setError('Incorrect password.');
          throw new Error('Incorrect password.');
        }
      }
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.password === password) {
          const { password, ...userWithoutPassword } = userData;
          const user = { id: userDoc.id, ...userWithoutPassword };
          setCurrentUser(user);
          return { success: true, user };
        } else {
          setError('Incorrect password.');
          throw new Error('Incorrect password.');
        }
      }
      setError('Invalid email or password.');
      throw new Error('Invalid email or password.');
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      const pendingQuery = query(collection(db, 'pendingUsers'), where('email', '==', email));
      const pendingSnapshot = await getDocs(pendingQuery);
      if (!usersSnapshot.empty || !pendingSnapshot.empty) {
        setError('Email already registered.');
        throw new Error('Email already registered.');
      }
      const newUser = {
        email,
        password, // In a real app, this should be hashed
        name,
        role: 'user',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2E7D32&color=fff`,
        createdAt: serverTimestamp(),
        approved: false
      };
      const docRef = await addDoc(collection(db, 'pendingUsers'), newUser);
      await addNotification({
        type: 'new_user',
        title: 'New User Registration',
        message: `${name} (${email}) has registered and is waiting for approval.`,
        userId: docRef.id,
        userEmail: email,
        userName: name
      });
      const { password: _, ...userWithoutPassword } = newUser;
      const user = { id: docRef.id, ...userWithoutPassword };
      setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  };

  const approveUser = async (userId) => {
    try {
      const userDocRef = doc(db, 'pendingUsers', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        setError('User not found in pending users.');
        return;
      }
      const userData = userDoc.data();
      userData.approved = true;
      await addDoc(collection(db, 'users'), userData);
      await deleteDoc(userDocRef);
      await addNotification({
        type: 'user_approved',
        title: 'User Approved',
        message: `${userData.name} (${userData.email}) has been approved and can now access analytics.`,
        userId: userId,
        userEmail: userData.email,
        userName: userData.name
      });
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, approved: true });
      }
    } catch (error) {
      setError('Error approving user. Please try again.');
      console.error('Error approving user:', error);
    }
  };

  const rejectUser = async (userId) => {
    try {
      const userDocRef = doc(db, 'pendingUsers', userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        setError('User not found in pending users.');
        return;
      }
      const userData = userDoc.data();
      await deleteDoc(userDocRef);
      await addNotification({
        type: 'user_rejected',
        title: 'User Rejected',
        message: `${userData.name} (${userData.email}) has been rejected.`,
        userId: userId,
        userEmail: userData.email,
        userName: userData.name
      });
      if (currentUser && currentUser.id === userId) {
        logout();
      }
    } catch (error) {
      setError('Error rejecting user. Please try again.');
      console.error('Error rejecting user:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      if (currentUser.role === 'user') {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, updates);
      }
    } catch (error) {
      setError('Error updating profile. Please try again.');
      console.error('Error updating profile:', error);
    }
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const isUser = () => {
    return currentUser?.role === 'user';
  };

  const isApproved = () => {
    return currentUser?.approved === true;
  };

  const canAccessAnalytics = () => {
    return isAdmin() || (isUser() && isApproved());
  };

  const value = useMemo(() => ({
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    isUser,
    isApproved,
    canAccessAnalytics,
    loading,
    pendingUsers,
    notifications,
    users,
    approveUser,
    rejectUser,
    markNotificationAsRead
  }), [currentUser, loading, pendingUsers, notifications, users]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
}; 
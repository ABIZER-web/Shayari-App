import { auth } from './firebase';

// Get the email from the hidden environment variable
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const isAdmin = (username) => {
  const user = auth.currentUser;
  
  // Return TRUE only if user is logged in AND email matches exactly
  return user && user.email === ADMIN_EMAIL;
};
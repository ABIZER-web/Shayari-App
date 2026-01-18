import { auth } from './firebase';

// The ONLY email allowed to be Admin
export const ADMIN_EMAIL = "abizersaifee5253@gmail.com";

export const isAdmin = (username) => {
  // We ignore the 'username' param and check the real authenticated email
  const user = auth.currentUser;
  
  // Return TRUE only if user is logged in AND email matches exactly
  return user && user.email === ADMIN_EMAIL;
};
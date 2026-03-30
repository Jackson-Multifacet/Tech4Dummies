import * as functions from 'firebase-functions/v1';
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * Automatically assigns the 'student' role as a custom claim.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const customClaims = {
    role: 'student',
  };

  try {
    // Set custom user claims on the new user
    await admin.auth().setCustomUserClaims(user.uid, customClaims);

    // Update the user document in Firestore to match
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: 'student',
      displayName: user.displayName || 'New Student',
      photoURL: user.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      cohortId: null,
    }, { merge: true });

    console.log(`Successfully assigned default 'student' role to user: ${user.uid}`);
  } catch (error) {
    console.error('Error assigning default role:', error);
  }
});

/**
 * Admin utility to manually change user roles.
 */
export const setRole = onCall(async (request) => {
  // Check if the request is made by an admin
  if (!request.auth?.token.role || request.auth.token.role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Only admins can change roles.'
    );
  }

  const { uid, role } = request.data;
  
  if (!['student', 'mentor', 'admin'].includes(role)) {
    throw new HttpsError(
      'invalid-argument',
      'Invalid role specified.'
    );
  }

  await admin.auth().setCustomUserClaims(uid, { role });
  await admin.firestore().collection('users').doc(uid).update({ role });

  return { message: `Success! User ${uid} is now a ${role}.` };
});

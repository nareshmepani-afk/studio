
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { User } from "./types";
import { STANDARD_HOST_STORAGE_QUOTA_BYTES } from "./constants";

admin.initializeApp();

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const userProfile: User = {
    id: user.uid,
    email: user.email!,
    name: user.displayName!,
    createdAt: new Date().toISOString(),
    hostPassStatus: "free_host_pass_active",
    freeHostPassActivatedDate: new Date().toISOString(),
    sharedAccessStatus: "no_pass_initiated",
    storageUsedBytes: 0,
    storageQuota: { total: STANDARD_HOST_STORAGE_QUOTA_BYTES, used: 0 },
  };

  await admin.firestore().collection("users").doc(user.uid).set(userProfile);
});

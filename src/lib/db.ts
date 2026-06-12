/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, handleFirestoreError, OperationType } from "./firebase";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Meeting, AppSettings } from "../types";

// Collection paths
const MEETINGS_COLLECTION = "meetings";
const SETTINGS_COLLECTION = "settings";

export async function fetchUserMeetings(userId: string): Promise<Meeting[]> {
  const path = `${MEETINGS_COLLECTION} (query where ownerId == ${userId})`;
  
  // 1. If local user, bypass Firestore and use direct localStorage
  if (userId.startsWith("local_")) {
    try {
      const localData = localStorage.getItem(`mb_vault_cache_${userId}`);
      return localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Failed to read local meeting vault cache:", e);
      return [];
    }
  }

  // 2. Otherwise try Firestore with a secure local cache fallback
  try {
    const q = query(
      collection(db, MEETINGS_COLLECTION),
      where("ownerId", "==", userId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    const fetched: Meeting[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      fetched.push({
        id: docSnap.id,
        title: data.title || "Untitled Meeting",
        date: data.date || new Date().toISOString(),
        duration: data.duration || "00:00",
        transcript: data.transcript || "",
        summary: data.summary || "",
        audioMimeType: data.audioMimeType || undefined,
        isFavorite: data.isFavorite || false,
        audioSizeKb: data.audioSizeKb || undefined,
      });
    });
    
    // Cache successfully fetched meetings to survive offline/unverified sessions
    localStorage.setItem(`mb_vault_cache_${userId}`, JSON.stringify(fetched));
    return fetched;
  } catch (error) {
    console.warn("Firestore list fetch failed (offline or permission required), loading cached vault:", error);
    try {
      const cachedData = localStorage.getItem(`mb_vault_cache_${userId}`);
      return cachedData ? JSON.parse(cachedData) : [];
    } catch (e) {
      return [];
    }
  }
}

export async function saveMeetingToCloud(userId: string, meeting: Meeting): Promise<void> {
  const docId = meeting.id;
  const path = `${MEETINGS_COLLECTION}/${docId}`;

  // 1. Instantly write to the local cache list to guarantee persistent storage
  const cacheKey = `mb_vault_cache_${userId}`;
  try {
    const existingStr = localStorage.getItem(cacheKey);
    let existingList: Meeting[] = existingStr ? JSON.parse(existingStr) : [];
    existingList = existingList.filter((m) => m.id !== meeting.id);
    existingList.unshift(meeting);
    localStorage.setItem(cacheKey, JSON.stringify(existingList));
  } catch (cacheErr) {
    console.error("Local storage vault backup write failed:", cacheErr);
  }

  // 2. If simulated local user, avoid talking to Firestore
  if (userId.startsWith("local_")) {
    return;
  }

  // 3. Keep Firestore synchrony
  try {
    const docRef = doc(db, MEETINGS_COLLECTION, docId);
    await setDoc(docRef, {
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration,
      transcript: meeting.transcript,
      summary: meeting.summary,
      ownerId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      audioMimeType: meeting.audioMimeType || null,
      audioSizeKb: meeting.audioSizeKb || null,
      isFavorite: meeting.isFavorite || false,
    });
  } catch (error) {
    console.warn("Firestore meeting write failed. Note kept secure in local vault cache:", error);
  }
}

export async function updateMeetingInCloud(
  userId: string,
  meetingId: string,
  updates: Partial<Meeting>
): Promise<void> {
  const path = `${MEETINGS_COLLECTION}/${meetingId}`;

  // 1. Sync local cache immediately
  const cacheKey = `mb_vault_cache_${userId}`;
  try {
    const existingStr = localStorage.getItem(cacheKey);
    if (existingStr) {
      const existingList: Meeting[] = JSON.parse(existingStr);
      const updatedList = existingList.map((m) => {
        if (m.id === meetingId) {
          return { ...m, ...updates };
        }
        return m;
      });
      localStorage.setItem(cacheKey, JSON.stringify(updatedList));
    }
  } catch (cacheErr) {
    console.error("Failed to update status in local vault cache:", cacheErr);
  }

  // 2. Handle local simulated logins
  if (userId.startsWith("local_")) {
    return;
  }

  // 3. Write to Firestore
  try {
    const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Meeting document does not exist");
    }
    const current = docSnap.data();
    if (current.ownerId !== userId) {
      throw new Error("Unauthorized meeting update attempt");
    }

    const incomingData = {
      id: current.id,
      title: updates.title !== undefined ? updates.title : current.title,
      date: current.date,
      duration: current.duration,
      transcript: updates.transcript !== undefined ? updates.transcript : current.transcript,
      summary: updates.summary !== undefined ? updates.summary : current.summary,
      ownerId: userId,
      createdAt: current.createdAt,
      updatedAt: serverTimestamp(),
      audioMimeType: current.audioMimeType || null,
      audioSizeKb: current.audioSizeKb || null,
      isFavorite: updates.isFavorite !== undefined ? updates.isFavorite : (current.isFavorite || false),
    };

    await setDoc(docRef, incomingData);
  } catch (error) {
    console.warn("Firestore meeting update stalled, updated locally:", error);
  }
}

export async function deleteMeetingFromCloud(userId: string, meetingId: string): Promise<void> {
  const path = `${MEETINGS_COLLECTION}/${meetingId}`;

  // 1. Sync local cache immediately
  const cacheKey = `mb_vault_cache_${userId}`;
  try {
    const existingStr = localStorage.getItem(cacheKey);
    if (existingStr) {
      const existingList: Meeting[] = JSON.parse(existingStr);
      const filteredList = existingList.filter((m) => m.id !== meetingId);
      localStorage.setItem(cacheKey, JSON.stringify(filteredList));
    }
  } catch (cacheErr) {
    console.error("Failed to delete from local vault cache:", cacheErr);
  }

  // 2. Handle local simulated logins
  if (userId.startsWith("local_")) {
    return;
  }

  // 3. Send delete to Firestore
  try {
    const docRef = doc(db, MEETINGS_COLLECTION, meetingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().ownerId === userId) {
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.warn("Firestore meet delete query failed:", error);
  }
}

export async function fetchUserSettings(userId: string): Promise<AppSettings | null> {
  const path = `${SETTINGS_COLLECTION}/${userId}`;

  // 1. For local simulated logins, load settings locally
  if (userId.startsWith("local_")) {
    try {
      const localData = localStorage.getItem(`mb_settings_local_${userId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (e) {
      return null;
    }
  }

  // 2. Try Firestore
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings: AppSettings = {
        aiProvider: data.aiProvider || "gemini",
        apiKey: data.apiKey || "",
        audioFolder: data.audioFolder || "/MeetingBrain/Vault/",
        autoDeleteAudio: data.autoDeleteAudio !== undefined ? data.autoDeleteAudio : true,
      };
      localStorage.setItem(`mb_settings_cloud_${userId}`, JSON.stringify(settings));
      return settings;
    }
    const cachedData = localStorage.getItem(`mb_settings_cloud_${userId}`);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.warn("Firestore fetch setting failed, reading local mirror:", error);
    try {
      const cachedData = localStorage.getItem(`mb_settings_cloud_${userId}`);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (e) {
      return null;
    }
  }
}

export async function saveUserSettingsToCloud(userId: string, settings: AppSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${userId}`;

  // 1. Persist local file backup
  if (userId.startsWith("local_")) {
    localStorage.setItem(`mb_settings_local_${userId}`, JSON.stringify(settings));
    return;
  } else {
    localStorage.setItem(`mb_settings_cloud_${userId}`, JSON.stringify(settings));
  }

  // 2. Sync to Firestore
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    const exists = docSnap.exists();

    const timestamp = serverTimestamp();
    const payload = {
      aiProvider: settings.aiProvider,
      apiKey: settings.apiKey,
      audioFolder: settings.audioFolder,
      autoDeleteAudio: settings.autoDeleteAudio,
      ownerId: userId,
      createdAt: exists ? docSnap.data().createdAt : timestamp,
      updatedAt: timestamp,
    };

    await setDoc(docRef, payload);
  } catch (error) {
    console.warn("Firestore options save failed, written to local cache:", error);
  }
}


"use server";

import { AddMemoryPageContent } from "@/components/memory/AddMemoryPageContent";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

interface MemoryData {
  id: string;
  title: string;
  date: string;
  description: string;
  userId: string;
  promptId?: string;
}

interface AddMemoryPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AddMemoryPage(props: AddMemoryPageProps) {
  console.log("[SERVER] AddMemoryPage execution started.");
  let memoryData = null;
  let error: string | null = null;
  
  const params = props.searchParams;
  const editMemoryId = typeof params.editMemoryId === 'string' ? params.editMemoryId : undefined;
  const promptId = typeof params.promptId === 'string' ? params.promptId : undefined;
  const promptText = typeof params.prompt === 'string' ? params.prompt : undefined;
  const componentKey = Date.now().toString();

  try {
    if (editMemoryId) {
      console.log(`[SERVER] Attempting to edit memory: ${editMemoryId}`);
      
      const cookieStore = cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

      if (!sessionCookie || !sessionCookie.value) {
        throw new Error("User not authenticated.");
      }

      const session = JSON.parse(sessionCookie.value);
      const userId = session.uid;

      const memoryRef = doc(db, 'users', userId, 'memories', editMemoryId);
      const memorySnap = await getDoc(memoryRef);

      if (!memorySnap.exists()) {
        console.error(`[SERVER] Memory with ID ${editMemoryId} not found for user ${userId}.`);
        throw new Error("Memory not found.");
      }

      const data = memorySnap.data();
      memoryData = {
        id: memorySnap.id,
        title: data.title,
        date: data.date,
        description: data.description,
        userId: data.userId,
        promptId: data.promptId,
      };
      console.log(`[SERVER] Successfully loaded memory data for: ${editMemoryId}`);
    } else {
      console.log("[SERVER] No editMemoryId found, proceeding to render new memory page.");
    }

    return (
      <AddMemoryPageContent
        key={componentKey}
        memoryToEdit={memoryData}
        promptId={promptId}
        initialCustomPrompt={promptText}
        error={error}
      />
    );

  } catch (e: any) {
    console.error("[SERVER CRITICAL ERROR]", e);
    error = e.message || "An unexpected error occurred while loading the page.";
    return (
      <AddMemoryPageContent
        key={componentKey}
        memoryToEdit={null}
        promptId={promptId}
        initialCustomPrompt={promptText}
        error={error}
      />
    );
  }
}

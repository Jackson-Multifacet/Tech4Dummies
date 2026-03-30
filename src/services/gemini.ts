import { GoogleGenAI, Type } from "@google/genai";
import { vectorStore } from "./vectorStore";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function populateVectorStore(lessons: { id: string, title: string, content: string }[]) {
  for (const lesson of lessons) {
    await vectorStore.addEntry(lesson.id, `${lesson.title}\n${lesson.content}`, { title: lesson.title });
  }
}

export async function generateCourseContent(title: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a course description and detailed introductory content in Markdown for a tech course titled: "${title}".`,
      config: {
        systemInstruction: "You are an expert curriculum designer for Tech4Dummies academy. Your tone is professional yet accessible. Return the result in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A concise 2-3 sentence description of the course."
            },
            content: {
              type: Type.STRING,
              description: "Detailed introductory content in Markdown format, including what students will learn."
            }
          },
          required: ["description", "content"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateLessonContent(title: string, topic: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a detailed educational lesson in Markdown format for a tech course.
      Title: ${title}
      Topic: ${topic}
      Include:
      - Introduction
      - Key Concepts
      - Code Examples (if applicable)
      - Summary
      - A short quiz question at the end.`,
      config: {
        systemInstruction: "You are an expert technical educator for Tech4Dummies academy. Your tone is encouraging, simple, and character-first.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function generateAssignmentContent(title: string, courseTitle: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a detailed assignment description in Markdown format for a tech course.
      Course: ${courseTitle}
      Assignment Title: ${title}
      Include:
      - Objective
      - Requirements
      - Submission Guidelines
      - Hints or Tips`,
      config: {
        systemInstruction: "You are an expert technical educator for Tech4Dummies academy. Your tone is encouraging, simple, and clear.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

export async function askBuddy(lessonContent: string, question: string) {
  try {
    // Retrieve relevant context from past lessons
    const relevantLessons = await vectorStore.search(question, 2);
    const contextFromPastLessons = relevantLessons
      .map(l => `From lesson "${l.metadata.title}":\n${l.text}`)
      .join("\n\n---\n\n");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current Lesson Context:\n${lessonContent}\n\nPast Lessons Context:\n${contextFromPastLessons}\n\nQuestion: ${question}`,
      config: {
        systemInstruction: "You are 'Buddy', the Tech4Dummies AI Learning Assistant. Your goal is to help students understand the lesson content. Be friendly, encouraging, and use simple analogies where possible. Always refer to yourself as Buddy. Use the provided context from current and past lessons to give more relevant answers.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

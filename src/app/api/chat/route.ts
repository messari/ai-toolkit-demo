import { NextRequest } from "next/server";
import { ChatRequest } from "@/types/chat";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;

  const response = await fetch(
    "https://api.messari.io/ai/openai/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MESSARI-API-KEY": process.env.MESSARI_API_KEY || "",
      },
      body: JSON.stringify({
        ...body,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    return new Response("Error calling Messari API", {
      status: response.status,
    });
  }

  // Create a TransformStream to handle the streaming response
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error("Error parsing chunk:", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error reading stream:", e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream);
}

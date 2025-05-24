export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  messages: Message[];
  stream?: boolean;
  verbosity?: "balanced" | "concise" | "detailed";
  response_format?: "plaintext" | "markdown";
  inline_citations?: boolean;
  generate_related_questions?: number;
};

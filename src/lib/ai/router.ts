import axios from "axios";

export interface LLMResponse {
  text: string;
  provider: "groq" | "cerebras" | "gemini" | "nvidia" | "fallback";
}

/**
 * Universal Multi-Provider LLM Router with automatic zero-downtime failover.
 * Priority Cascade: Groq (Ultra-Fast) -> Cerebras -> Gemini -> NVIDIA NIM -> Fallback
 */
export async function queryMultiProviderLLM(
  systemPrompt: string,
  userPrompt: string,
  responseJson: boolean = true
): Promise<LLMResponse> {
  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY;

  // 1. Try Groq (Ultra-Fast 500+ tokens/sec)
  if (groqKey && !groqKey.includes("YOUR_")) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: responseJson ? { type: "json_object" } : undefined,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );
      const text = res.data?.choices?.[0]?.message?.content;
      if (text) return { text, provider: "groq" };
    } catch (err) {
      console.warn("[LLM Router Warning] Groq failed, falling over to Cerebras:", (err as Error).message);
    }
  }

  // 2. Try Cerebras (1800+ tokens/sec)
  if (cerebrasKey && !cerebrasKey.includes("YOUR_")) {
    try {
      const res = await axios.post(
        "https://api.cerebras.ai/v1/chat/completions",
        {
          model: "llama3.1-70b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: responseJson ? { type: "json_object" } : undefined,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${cerebrasKey}`,
            "Content-Type": "application/json",
          },
          timeout: 8000,
        }
      );
      const text = res.data?.choices?.[0]?.message?.content;
      if (text) return { text, provider: "cerebras" };
    } catch (err) {
      console.warn("[LLM Router Warning] Cerebras failed, falling over to Gemini:", (err as Error).message);
    }
  }

  // 3. Try Gemini
  if (geminiKey && !geminiKey.includes("YOUR_")) {
    try {
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: responseJson ? { responseMimeType: "application/json" } : undefined,
        },
        { timeout: 10000 }
      );
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, provider: "gemini" };
    } catch (err) {
      console.warn("[LLM Router Warning] Gemini failed, falling over to NVIDIA NIM:", (err as Error).message);
    }
  }

  // 4. Try NVIDIA NIM
  if (nvidiaKey && !nvidiaKey.includes("YOUR_")) {
    try {
      const res = await axios.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${nvidiaKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      const text = res.data?.choices?.[0]?.message?.content;
      if (text) return { text, provider: "nvidia" };
    } catch (err) {
      console.warn("[LLM Router Warning] NVIDIA NIM failed:", (err as Error).message);
    }
  }

  return { text: "", provider: "fallback" };
}

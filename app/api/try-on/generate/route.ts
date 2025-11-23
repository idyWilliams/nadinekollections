import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, logTryOnSession } from "@/lib/analytics";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Product {
  title: string;
  color?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { mannequinSettings, products, guestId, engine = 'gemini' } = body;

    if (!mannequinSettings || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Rate Limiting Check
    const isAllowed = await checkRateLimit(supabase, { userId: user?.id, guestId });
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Free tier limit reached. Please sign in for extended access." },
        { status: 429 }
      );
    }

    let imageUrl = "";
    let usedEngine = engine;
    let prompt = "";

    const generateWithGemini = async () => {
      const productDescriptions = products.map((p: Product) => `${p.title} (${p.color || 'Standard'})`).join(", ");
      prompt = `Generate a highly detailed, photorealistic fashion description for an image generation model.
      Subject: A ${mannequinSettings.age} ${mannequinSettings.gender} model with ${mannequinSettings.skinTone} complexion and ${mannequinSettings.size} body type.
      Wearing: ${productDescriptions}.
      Setting: High-end fashion studio, professional lighting, 4k resolution.
      Pose: Confident, standing.
      Style: Vogue editorial.`;

      if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API Key missing");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Gemini generated description:", text);

      // Simulate image generation based on description
      return mannequinSettings.gender === 'male'
        ? "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?q=80&w=1000&auto=format&fit=crop"
        : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop";
    };

    const generateWithNano = async () => {
      // Mock Nano Banana 2 API call
      if (!process.env.NANO_BANANA_API_KEY) throw new Error("Nano Banana API Key missing");

      console.log("Calling Nano Banana 2 with settings:", mannequinSettings);
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Return different images to distinguish engines
      return mannequinSettings.gender === 'male'
        ? "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop"
        : "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1000&auto=format&fit=crop";
    };

    try {
      if (engine === 'gemini') {
        imageUrl = await generateWithGemini();
      } else {
        imageUrl = await generateWithNano();
      }
    } catch (primaryError) {
      console.error(`Primary engine ${engine} failed:`, primaryError);

      // Fallback Logic
      try {
        console.log("Attempting fallback engine...");
        if (engine === 'gemini') {
          usedEngine = 'nano';
          imageUrl = await generateWithNano();
        } else {
          usedEngine = 'gemini';
          imageUrl = await generateWithGemini();
        }
      } catch (fallbackError) {
        console.error("Fallback engine failed:", fallbackError);
        // Ultimate Fallback (Static)
        usedEngine = 'static-fallback';
        imageUrl = mannequinSettings.gender === 'male'
          ? "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?q=80&w=1000&auto=format&fit=crop"
          : "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop";
      }
    }

    // Save Session to Database via Analytics Helper
    const { data: session } = await logTryOnSession(supabase, {
      userId: user?.id || null,
      guestId: user ? undefined : guestId,
      mannequinSettings,
      products,
      imageUrl,
      prompt,
      engine: usedEngine
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      sessionId: session?.id,
      engineUsed: usedEngine
    });

  } catch (error: unknown) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image. Please try again." },
      { status: 500 }
    );
  }
}

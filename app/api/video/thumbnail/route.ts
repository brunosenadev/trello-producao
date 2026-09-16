import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { extractYoutubeId, youtubeThumbnailUrl } from "@/lib/video";

const bodySchema = z.object({ url: z.string().trim().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Informe uma URL de vídeo válida." });
  }

  const videoId = extractYoutubeId(parsed.data.url);
  if (!videoId) {
    return NextResponse.json({
      success: false,
      error:
        "Não foi possível identificar um vídeo do YouTube nesta URL. No momento apenas links do YouTube são suportados.",
    });
  }

  const thumbnailUrl = youtubeThumbnailUrl(videoId);

  try {
    const check = await fetch(thumbnailUrl, { method: "HEAD" });
    if (!check.ok) {
      return NextResponse.json({
        success: false,
        error: "Não foi possível obter a thumbnail deste vídeo.",
      });
    }
  } catch {
    return NextResponse.json({
      success: false,
      error: "Falha ao conectar ao YouTube para buscar a thumbnail. Tente novamente.",
    });
  }

  return NextResponse.json({ success: true, thumbnailUrl });
}

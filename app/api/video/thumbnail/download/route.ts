import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Não autenticado.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  // Restringe o proxy a hosts de thumbnail do YouTube — evita virar um
  // proxy genérico (SSRF) para qualquer URL arbitrária.
  if (!url || !/^https:\/\/img\.youtube\.com\//.test(url)) {
    return new NextResponse("URL inválida.", { status: 400 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Não foi possível baixar a imagem.", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Content-Disposition": 'attachment; filename="thumbnail.jpg"',
    },
  });
}

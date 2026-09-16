"use client";

import { Download, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThumbnailResponse = { success: true; thumbnailUrl: string } | { success: false; error: string };

export function ThumbnailField({
  defaultVideoUrl,
  defaultThumbnailUrl,
}: {
  defaultVideoUrl?: string | null;
  defaultThumbnailUrl?: string | null;
}) {
  const [url, setUrl] = useState(defaultVideoUrl ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(defaultThumbnailUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchThumbnail() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/video/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as ThumbnailResponse;
      if (data.success) {
        setThumbnail(data.thumbnailUrl);
        setError(null);
      } else {
        setThumbnail(null);
        setError(data.error);
      }
    } catch {
      setThumbnail(null);
      setError("Falha ao buscar a thumbnail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="videoUrl">Vídeo base (URL)</Label>
      <input type="hidden" name="thumbnailUrl" value={thumbnail ?? ""} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="videoUrl"
          name="videoUrl"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <Button
          type="button"
          variant="outline"
          onClick={fetchThumbnail}
          disabled={loading || !url.trim()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Buscar thumbnail
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {thumbnail && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt="Prévia da thumbnail"
            className="h-20 w-32 rounded-lg border object-cover"
          />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={
              <a href={`/api/video/thumbnail/download?url=${encodeURIComponent(thumbnail)}`} download />
            }
          >
            <Download className="size-4" />
            Baixar thumbnail
          </Button>
        </div>
      )}
    </div>
  );
}

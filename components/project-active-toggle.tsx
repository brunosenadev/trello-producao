"use client";

import { useTransition } from "react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggleProjectActive } from "@/lib/actions/projects";

export function ProjectActiveToggle({
  projectId,
  isActive,
}: {
  projectId: string;
  isActive: boolean;
}) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
      <Label htmlFor="project-active" className="text-muted-foreground">
        {isActive ? "Ativo" : "Inativo"}
      </Label>
      <Switch
        id="project-active"
        checked={isActive}
        onCheckedChange={(checked) => startTransition(() => toggleProjectActive(projectId, checked))}
      />
    </div>
  );
}

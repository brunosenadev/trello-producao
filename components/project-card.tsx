import { FolderKanban } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { listProjects } from "@/lib/queries/projects";

export type ProjectListItem = Awaited<ReturnType<typeof listProjects>>[number];

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <Card className="h-full gap-3 rounded-2xl transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="size-4" />
            </div>
            <CardTitle className="text-base">{project.name}</CardTitle>
          </div>
          {!project.isActive && <Badge variant="secondary">Inativo</Badge>}
        </CardHeader>
        <CardContent className="space-y-2">
          {project.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Responsável: {project.assignedUser?.name ?? "Não atribuído"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

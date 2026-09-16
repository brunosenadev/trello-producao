import { FolderKanban } from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { listProjects } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";
import { requireUser } from "@/lib/session";

export default async function ProjectsPage() {
  await requireUser();
  const [projects, users] = await Promise.all([listProjects(), listUsers()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os projetos e suas tarefas recorrentes.
          </p>
        </div>
        <ProjectFormDialog users={users} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-20 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum projeto cadastrado ainda</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro projeto para começar a organizar as tarefas recorrentes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

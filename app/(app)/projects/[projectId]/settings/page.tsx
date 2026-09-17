import { notFound } from "next/navigation";

import { CopyTemplatesDialog } from "@/components/copy-templates-dialog";
import { ProjectActiveToggle } from "@/components/project-active-toggle";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { Button } from "@/components/ui/button";
import { TaskTemplateFormDialog } from "@/components/task-template-form-dialog";
import { TaskTemplateList } from "@/components/task-template-list";
import { getProject, getProjectTemplates, listProjects } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";
import { requireUser } from "@/lib/session";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireUser();
  const { projectId } = await params;

  const project = await getProject(projectId);
  if (!project) notFound();

  const [templates, users, allProjects] = await Promise.all([
    getProjectTemplates(projectId),
    listUsers(),
    listProjects(),
  ]);
  const otherProjects = allProjects.filter((p) => p.id !== projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tarefas recorrentes</h1>
          <p className="text-sm text-muted-foreground">
            {project.name} · configure os templates que geram as ocorrências diárias.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectActiveToggle projectId={projectId} isActive={project.isActive} />
          <ProjectFormDialog
            users={users}
            project={project}
            trigger={<Button variant="outline">Editar projeto</Button>}
          />
          {otherProjects.length > 0 && (
            <CopyTemplatesDialog targetProjectId={projectId} otherProjects={otherProjects} />
          )}
          <TaskTemplateFormDialog projectId={projectId} />
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nenhuma tarefa recorrente cadastrada ainda.
        </div>
      ) : (
        <TaskTemplateList projectId={projectId} templates={templates} />
      )}
    </div>
  );
}

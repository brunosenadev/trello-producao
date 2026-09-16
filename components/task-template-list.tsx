"use client";

import { ArrowDown, ArrowUp, ListChecks, Pencil } from "lucide-react";
import { useTransition } from "react";

import { TaskTemplateFormDialog } from "@/components/task-template-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { moveTemplate, setTemplateActive } from "@/lib/actions/templates";
import { centsToBRL } from "@/lib/money";
import type { getProjectTemplates } from "@/lib/queries/projects";

type Template = Awaited<ReturnType<typeof getProjectTemplates>>[number];

const FREQUENCY_LABEL: Record<string, string> = {
  DIARIA: "Diária",
  DIAS_SEMANA: "Dias específicos",
  DESATIVADA: "Desativada",
};

export function TaskTemplateList({
  projectId,
  templates,
}: {
  projectId: string;
  templates: Template[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {templates.map((template, index) => (
        <Card key={template.id} className={!template.isActive ? "opacity-60" : undefined}>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{template.title}</h3>
                <Badge variant="outline">{FREQUENCY_LABEL[template.frequency]}</Badge>
                {!template.isActive && <Badge variant="secondary">Inativa</Badge>}
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListChecks className="size-3.5" />
                {template.checklistTemplates.length} passos · {centsToBRL(template.amountCents)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={index === 0 || isPending}
                onClick={() => startTransition(() => moveTemplate(template.id, projectId, "up"))}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={index === templates.length - 1 || isPending}
                onClick={() => startTransition(() => moveTemplate(template.id, projectId, "down"))}
              >
                <ArrowDown className="size-4" />
              </Button>
              <TaskTemplateFormDialog
                projectId={projectId}
                template={template}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <Switch
                checked={template.isActive}
                onCheckedChange={(checked) =>
                  startTransition(() => setTemplateActive(template.id, projectId, checked))
                }
              />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

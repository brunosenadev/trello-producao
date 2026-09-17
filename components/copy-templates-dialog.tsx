"use client";

import { Copy, ListChecks } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copyTaskTemplates, fetchTemplatesForCopy } from "@/lib/actions/templates";
import { centsToBRL } from "@/lib/money";

type Template = Awaited<ReturnType<typeof fetchTemplatesForCopy>>[number];

const FREQUENCY_LABEL: Record<string, string> = {
  DIARIA: "Diária",
  DIAS_SEMANA: "Dias específicos",
  DESATIVADA: "Desativada",
};

export function CopyTemplatesDialog({
  targetProjectId,
  otherProjects,
}: {
  targetProjectId: string;
  otherProjects: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState<string>("");
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function selectSource(projectId: string | null) {
    if (!projectId) return;
    setSourceProjectId(projectId);
    setTemplates(null);
    setSelected(new Set());
    startTransition(async () => {
      const rows = await fetchTemplatesForCopy(projectId);
      setTemplates(rows);
      setSelected(new Set(rows.map((row) => row.id)));
    });
  }

  function toggle(templateId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) next.delete(templateId);
      else next.add(templateId);
      return next;
    });
  }

  function reset() {
    setSourceProjectId("");
    setTemplates(null);
    setSelected(new Set());
  }

  function copy() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await copyTaskTemplates(targetProjectId, sourceProjectId, ids);
      toast.success(
        ids.length === 1 ? "1 tarefa copiada." : `${ids.length} tarefas copiadas.`,
      );
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline">
            <Copy className="size-4" />
            Copiar de outro projeto
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Copiar tarefas de outro projeto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source-project">Projeto de origem</Label>
            <Select value={sourceProjectId} onValueChange={selectSource}>
              <SelectTrigger id="source-project" className="w-full">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {otherProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceProjectId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tarefas</Label>
                {templates && templates.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() =>
                      setSelected((prev) =>
                        prev.size === templates.length
                          ? new Set()
                          : new Set(templates.map((t) => t.id)),
                      )
                    }
                  >
                    {selected.size === templates.length ? "Desmarcar todas" : "Selecionar todas"}
                  </button>
                )}
              </div>

              {templates === null && (
                <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
              )}
              {templates?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Esse projeto não tem tarefas recorrentes cadastradas.
                </p>
              )}
              {templates?.map((template) => (
                <label
                  key={template.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
                >
                  <Checkbox
                    checked={selected.has(template.id)}
                    onCheckedChange={() => toggle(template.id)}
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{template.title}</span>
                      <Badge variant="outline">{FREQUENCY_LABEL[template.frequency]}</Badge>
                      {!template.isActive && <Badge variant="secondary">Inativa</Badge>}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ListChecks className="size-3.5" />
                      {template.checklistTemplates.length} passos ·{" "}
                      {centsToBRL(template.amountCents)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={copy} disabled={selected.size === 0 || isPending}>
            {isPending
              ? "Copiando..."
              : selected.size > 0
                ? `Copiar ${selected.size} tarefa${selected.size > 1 ? "s" : ""}`
                : "Copiar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

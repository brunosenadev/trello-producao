"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProject, updateProject } from "@/lib/actions/projects";

type UserOption = { id: string; name: string };

type ProjectFormDialogProps = {
  users: UserOption[];
  project?: {
    id: string;
    name: string;
    description: string | null;
    assignedUserId: string | null;
  };
  trigger?: React.ReactElement;
};

export function ProjectFormDialog({ users, project, trigger }: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!project;

  async function action(formData: FormData) {
    if (isEdit) {
      await updateProject(project.id, formData);
      setOpen(false);
    } else {
      await createProject(formData);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="size-4" />
              Novo projeto
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar projeto" : "Novo projeto"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" required defaultValue={project?.name} placeholder="Ex: Nubian" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description ?? ""}
              placeholder="Descrição opcional do projeto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedUserId">Responsável</Label>
            <Select name="assignedUserId" defaultValue={project?.assignedUserId ?? undefined}>
              <SelectTrigger id="assignedUserId" className="w-full">
                <SelectValue placeholder="Selecionar funcionário" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">{isEdit ? "Salvar alterações" : "Criar projeto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

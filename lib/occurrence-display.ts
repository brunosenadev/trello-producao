/** Título específico do vídeo, ou o nome do tipo de demanda enquanto não preenchido. */
export function occurrenceDisplayTitle(occurrence: {
  title: string | null;
  taskTemplate: { title: string };
}): string {
  return occurrence.title || occurrence.taskTemplate.title;
}

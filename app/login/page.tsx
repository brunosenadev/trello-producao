import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Esse e-mail do Google não está autorizado. Confira se ele é exatamente igual ao CONTRATANTE_EMAIL ou FUNCIONARIO_EMAIL configurado no .env.local (maiúsculas/minúsculas não importam, mas precisa ser o mesmo endereço).",
  Configuration:
    "Erro de configuração do login (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou AUTH_SECRET ausentes/incorretos no .env.local).",
  OAuthAccountNotLinked:
    "Esse e-mail já está associado a outra forma de login.",
  Verification: "O link de verificação expirou ou já foi usado.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? `Erro ao entrar (${error}).`) : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sisplan</h1>
          <p className="text-sm text-muted-foreground">
            Projetos, tarefas diárias e financeiro em um só lugar.
          </p>
        </div>
        {errorMessage && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full" size="lg">
            Continuar com Google
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Acesso restrito às contas autorizadas do contratante e do funcionário.
        </p>
      </div>
    </main>
  );
}

import { db } from "@/lib/db";

export async function listUsers() {
  return db.query.users.findMany({ orderBy: (u, { asc }) => [asc(u.name)] });
}

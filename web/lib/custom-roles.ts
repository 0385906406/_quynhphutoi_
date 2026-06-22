import { getDb, ensureIndexes } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { RolePerms } from "@/lib/role-permissions";
import { DEFAULT_USER_PERMS } from "@/lib/role-permissions";

export type CustomRoleDoc = {
  _id?: ObjectId;
  label: string;
  perms: RolePerms;
  createdAt: Date;
};

export type CustomRoleRow = {
  id: string;
  label: string;
  perms: RolePerms;
  createdAt: string;
};

async function col() {
  const db = await getDb();
  const c = db.collection<CustomRoleDoc>("custom_roles");
  await ensureIndexes("custom_roles", () =>
    c.createIndex({ label: 1 }, { unique: true }),
  );
  return c;
}

export function toCustomRoleRow(doc: CustomRoleDoc): CustomRoleRow {
  return {
    id: doc._id!.toString(),
    label: doc.label,
    perms: doc.perms,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function buildDefaultPerms(): RolePerms {
  return { ...DEFAULT_USER_PERMS };
}

export async function listCustomRoles(): Promise<CustomRoleRow[]> {
  const c = await col();
  const docs = await c.find({}).sort({ label: 1 }).toArray();
  return docs.map(toCustomRoleRow);
}

export async function getCustomRoleById(id: string): Promise<CustomRoleRow | null> {
  if (!ObjectId.isValid(id)) return null;
  const c = await col();
  const doc = await c.findOne({ _id: new ObjectId(id) });
  return doc ? toCustomRoleRow(doc) : null;
}

export async function createCustomRole(label: string, perms: RolePerms): Promise<CustomRoleRow> {
  const c = await col();
  const res = await c.insertOne({ label, perms, createdAt: new Date() } as CustomRoleDoc);
  return { id: res.insertedId.toString(), label, perms, createdAt: new Date().toISOString() };
}

export async function updateCustomRole(
  id: string,
  data: Partial<{ label: string; perms: RolePerms }>,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const c = await col();
  const res = await c.updateOne({ _id: new ObjectId(id) }, { $set: data });
  return res.matchedCount > 0;
}

export async function deleteCustomRole(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const c = await col();
  const res = await c.deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}

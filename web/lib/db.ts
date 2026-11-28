// Kết nối MongoDB — cache client qua hot-reload của Next dev.
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "quynhphu";

const g = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _ensuredIndexes?: Map<string, Promise<void>>;
};

if (!g._mongoClientPromise) {
  g._mongoClientPromise = // Chọn máy chủ tối đa 8s (mặc định 30s) — DB sự cố thì báo lỗi nhanh thay vì để người dùng nhìn màn hình quay hàng chục giây.
  new MongoClient(uri, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 }).connect();
}
const clientPromise = g._mongoClientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

// Đảm bảo index chỉ chạy MỘT lần cho mỗi `key` trong suốt vòng đời tiến trình.
// Trước đây mọi accessor (articles(), users()…) gọi createIndex ở MỖI request →
// thừa hàng loạt round-trip xuống Mongo. Cache promise theo key để chạy đúng 1 lần;
// nếu lỗi thì xoá khỏi cache để lần sau thử lại. Lưu ở globalThis để sống qua hot-reload.
const ensured = (g._ensuredIndexes ??= new Map());
export function ensureIndexes(key: string, run: () => Promise<unknown>): Promise<void> {
  let p = ensured.get(key);
  if (!p) {
    p = run()
      .then(() => undefined)
      .catch((e) => {
        ensured.delete(key);
        throw e;
      });
    ensured.set(key, p);
  }
  return p;
}

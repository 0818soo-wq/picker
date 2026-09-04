import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceRoleClient, ENTRY_PHOTO_BUCKET } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const department = String(formData.get("department") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const photo = formData.get("photo");

  if (!department || !name) {
    return NextResponse.json({ error: "소속과 이름을 입력해 주세요." }, { status: 400 });
  }
  if (department.length > 100 || name.length > 100) {
    return NextResponse.json({ error: "입력값이 너무 깁니다." }, { status: 400 });
  }
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "사진을 선택해 주세요." }, { status: 400 });
  }
  if (photo.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "사진 용량은 8MB 이하여야 합니다." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(photo.type)) {
    return NextResponse.json({ error: "지원하지 않는 이미지 형식입니다. (JPEG, PNG, WEBP, HEIC)" }, { status: 400 });
  }

  const extension = EXTENSION_BY_TYPE[photo.type] ?? "jpg";
  const path = `${randomUUID()}.${extension}`;

  const supabase = createServiceRoleClient();

  const { error: uploadError } = await supabase.storage
    .from(ENTRY_PHOTO_BUCKET)
    .upload(path, photo, { contentType: photo.type, upsert: false });

  if (uploadError) {
    console.error("photo upload failed", uploadError);
    return NextResponse.json({ error: "사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(ENTRY_PHOTO_BUCKET).getPublicUrl(path);

  const { error: insertError } = await supabase.from("entries").insert({
    department,
    name,
    photo_path: path,
    photo_url: publicUrlData.publicUrl,
  });

  if (insertError) {
    console.error("entry insert failed", insertError);
    await supabase.storage.from(ENTRY_PHOTO_BUCKET).remove([path]);
    return NextResponse.json({ error: "접수 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

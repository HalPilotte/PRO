import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { insertPlayer } from "@/lib/db";

/**
 * POST /api/players
 *
 * Accepts a multipart/form-data submission from the registration form.
 * - Inserts the player record into PostgreSQL
 * - Saves an optional uploaded photo to `public/uploads`
 * - Stores only the public URL path (e.g. `/uploads/<file>.png`) in the DB
 *
 * Notes:
 * - We intentionally support multiple field names (e.g. `player_first_name` and `firstName`)
 *   because we changed input names to reduce browser autofill/autocomplete.
 * - In production, consider adding file size limits + MIME validation + malware scanning.
 */
const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "23505";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Helper to read an optional string field from FormData.
    // We try multiple keys to remain backward compatible with older form field names.
    const getText = (keys: string[]) => {
      for (const key of keys) {
        const value = formData.get(key);
        if (typeof value === "string") return value.trim();
      }
      return null;
    };

    const firstName = getText(["player_first_name", "firstName"]);
    const lastName = getText(["player_last_name", "lastName"]);
    const address_1 =
      getText(["player_address_1", "address_1", "address1"]) || null;
    const address_2 =
      getText(["player_address_2", "address_2", "address2"]) || null;
    const city = getText(["player_city", "city"]) || null;
    const state = getText(["player_state", "state"]) || null;
    const zip = getText(["player_zip", "zip"]) || null;
    const email = getText(["player_email", "email"]);
    const phone = getText(["player_phone", "phone"]) || null;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required." },
        { status: 400 }
      );
    }

    let picturePath: string | null = null;
    // Photo upload is optional. If present, save to disk and store only the URL path.
    const picture = formData.get("player_picture") ?? formData.get("picture");
    if (picture instanceof File && picture.size > 0) {
      picturePath = await savePictureFile(picture);
    }

    // Insert into Postgres. `insertPlayer` returns the generated primary key.
    const playerId = await insertPlayer({
      firstName,
      lastName,
      address_1,
      address_2,
      city,
      state,
      zip,
      email,
      phone,
      picturePath,
    });

    return NextResponse.json({ playerId });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "A player with this email already exists." },
        { status: 409 }
      );
    }

    // Unexpected errors (DB offline, filesystem permission, etc.)
    console.error("Failed to register player", error);
    return NextResponse.json(
      { error: "Unable to register player. Please try again." },
      { status: 500 }
    );
  }
}

// Files written under `public/` are served directly by Next.js. This makes the file
// viewable at a stable URL like `/uploads/<filename>`.
const uploadDir = path.join(process.cwd(), "public", "uploads");

const ensureUploadDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Failed to ensure upload directory", error);
    throw new Error("Unable to prepare photo storage.");
  }
};

const savePictureFile = async (file: File) => {
  await ensureUploadDir();

  // Preserve the original file extension when possible.
  // We still randomize the name to avoid collisions and user-controlled filenames.
  const extension = path.extname(file.name) || ".bin";
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const filePath = path.join(uploadDir, filename);

  // Convert the web File to a Node Buffer and write to disk.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
};

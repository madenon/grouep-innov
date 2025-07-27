import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";  // npm i uuid

const saveFile = (file, folder) => {
  const uploadPath = path.join(process.cwd(), "uploads", folder);
  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
  const filePath = path.join(uploadPath, uniqueName);

  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${folder}/${uniqueName}`;
};

export default saveFile;
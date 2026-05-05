import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions } from "cloudinary";
import { Buffer } from "node:buffer";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const uploadRootFolder = process.env.CLOUDINARY_UPLOAD_ROOT_FOLDER;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Missing Cloudinary environment variables.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

function buildFolderPath(folderName: string) {
  const cleanFolder = folderName.trim().replace(/^\/+|\/+$/g, "");
  const root = uploadRootFolder?.trim().replace(/^\/+|\/+$/g, "");
  return root ? `${root}/${cleanFolder}` : cleanFolder;
}

function getPublicIdFromUrl(imageUrl: string) {
  const cleanUrl = imageUrl.split("?")[0];
  const uploadIndex = cleanUrl.indexOf("/upload/");

  if (uploadIndex === -1) {
    throw new Error("Invalid Cloudinary URL: missing /upload/ segment.");
  }

  const publicPath = cleanUrl.slice(uploadIndex + "/upload/".length);
  const pathWithoutVersion = publicPath.replace(/^v\d+\//, "");
  const lastDot = pathWithoutVersion.lastIndexOf(".");

  if (lastDot === -1) {
    return pathWithoutVersion;
  }

  return pathWithoutVersion.slice(0, lastDot);
}

export async function uploadImage(
  image: string | Buffer,
  folderName: string,
  options: UploadApiOptions = {}
) {
  const folderPath = buildFolderPath(folderName);

  const uploadData =
    typeof image === "string"
      ? image
      : `data:image/jpeg;base64,${Buffer.from(image).toString("base64")}`;

  const result = await cloudinary.uploader.upload(uploadData, {
    folder: folderPath,
    ...options,
  });

  return result.secure_url;
}

export async function uploadImages(
  images: Array<string | Buffer>,
  folderName: string,
  options: UploadApiOptions = {}
) {
  const uploads = images.map((image) => uploadImage(image, folderName, options));
  return Promise.all(uploads);
}

export async function deleteImageByUrl(imageUrl: string) {
  const publicId = getPublicIdFromUrl(imageUrl);
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });

  return result.result;
}

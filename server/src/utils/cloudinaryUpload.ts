import type { UploadApiResponse, UploadApiOptions } from "cloudinary";
import { getCloudinary } from "../config/cloudinary.ts";

export async function uploadImageBufferToCloudinary(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary upload failed: no result returned"));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

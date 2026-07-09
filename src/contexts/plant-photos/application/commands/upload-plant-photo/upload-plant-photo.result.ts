/**
 * Result of {@link UploadPlantPhotoCommand}: the new plant photo record.
 */
export interface UploadPlantPhotoResult {
  id: string;
  plantId: string;
  fileId: string;
  url: string;
  createdAt: Date;
}

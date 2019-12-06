import { CameraResultType, CameraPhoto } from '@capacitor/core';

export interface IPhotoService {

  loadSaved(): Promise<void>;

  getCameraConfig(): CameraResultType;

  savePhoto(cameraPhoto: CameraPhoto): Promise<Photo>;

  deletePhoto(): Promise<void>;
}

export class Photo {
  filepath: string;
  webviewPath: string;
  base64: string;
}
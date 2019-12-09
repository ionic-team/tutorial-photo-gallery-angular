import { CameraResultType, CameraPhoto } from '@capacitor/core';

export interface PhotoService {

  loadSaved(storageKey): Promise<Photo[]>;

  getCameraConfig(): CameraResultType;

  savePhoto(cameraPhoto: CameraPhoto): Promise<Photo>;
}

export class Photo {
  filepath: string;
  webviewPath: string;
  base64: string;
}
import { Injectable } from '@angular/core';
import { IPhotoService, Photo } from './IPhotoService';
import { CameraResultType, CameraPhoto, Filesystem, FilesystemDirectory, Capacitor } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebPhotoService implements IPhotoService {

  constructor() { }

  loadSaved(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getCameraConfig(): CameraResultType {
    return CameraResultType.DataUrl;
  }

  async savePhoto(cameraPhoto: CameraPhoto): Promise<Photo> {
    const base64Data = cameraPhoto.dataUrl;

    // Write the file to the data directory (instead of temp storage)
    const fileName = new Date().getTime() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    return {
      filepath: fileName,
      // Unnecessary since we're using base64 data
      webviewPath: "",
      base64: base64Data
    };
  }

  deletePhoto(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

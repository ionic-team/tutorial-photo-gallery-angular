import { Injectable } from '@angular/core';
import { IPhotoService } from './IPhotoService';

@Injectable({
  providedIn: 'root'
})
export class MobilePhotoService implements IPhotoService {
  
  constructor() { }

  loadSaved(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getCameraConfig(): import("@capacitor/core").CameraResultType {
    throw new Error("Method not implemented.");
  }
  
  savePhoto(cameraPhoto: import("@capacitor/core").CameraPhoto): Promise<import("./IPhotoService").Photo> {
    throw new Error("Method not implemented.");
  }

  deletePhoto(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

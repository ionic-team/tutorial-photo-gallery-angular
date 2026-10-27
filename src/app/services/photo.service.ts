import { Injectable, inject, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  public photos = signal<UserPhoto[]>([]);

  private PHOTO_STORAGE: string = 'photos';

  private platform = inject(Platform);

  public async addNewToGallery(): Promise<void> {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100, // highest quality (0 to 100)
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.update((photos) => [savedImageFile, ...photos]);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });
  }

  private async savePicture(photo: Photo) {
    let base64Data: string | Blob;

    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path!,
      });

      base64Data = file.data;
    } else {
      base64Data = await this.base64FromPath(photo.webPath!);
    }

    // Write the file to the data directory
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath,
      };
    }
  }

  private async base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
  }

  public async loadSaved(): Promise<void> {
    // Retrieve cached photo array data
    const { value: photoList } = await Preferences.get({ key: this.PHOTO_STORAGE });
    const photos = (photoList ? JSON.parse(photoList) : []) as UserPhoto[];

    // If running on the web...
    if (!this.platform.is('hybrid')) {
      for (const photo of photos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }

    this.photos.set(photos);
  }

  public async deletePhoto(photo: UserPhoto, position: number): Promise<void> {
    // Remove this photo from the photos signal
    this.photos.update((photos) => photos.filter((_, index) => index !== position));

    // Update photos array cache by overwriting the existing photo array
    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos()),
    });

    // Delete photo file from filesystem
    const filename = photo.filepath.slice(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

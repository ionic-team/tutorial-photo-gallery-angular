import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory } from '@capacitor/core';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";

  constructor() { }

  async loadSaved() {
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photos.value) || [];
  }

  // Use the device camera to take a photo.
  // Store the photo data into permanent file storage.
  // Store a reference to the photo in an array.
  async takePhoto() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri
    });
    
    const savedImageFile = await this.savePicture(capturedPhoto);

    this.photos.unshift({
      filepath: savedImageFile,
      webviewPath: Capacitor.convertFileSrc(savedImageFile)
    });

    // Cache all photo data for future retrieval
    //this.storage.set(this.PHOTO_STORAGE, this.photos);
  }

  // Save picture to file on device
  async savePicture(cameraImage) {
    // Read the file into its base64 version
    const readFile = await Filesystem.readFile({
      path: cameraImage
    });

    // Write the file to the data directory (instead of temp storage)
    const fileName = new Date().getTime() + '.jpeg';
    
    await Filesystem.writeFile({
      path: fileName,
      data: readFile.data,
      directory: FilesystemDirectory.Data
    });

    // Get the full filepath
    const fileUri = await Filesystem.getUri({
      directory: FilesystemDirectory.Data,
      path: fileName
    });

    return fileUri.uri;
  }

  // Delete picture by removing it from reference data and the filesystem
  async deletePicture(photo, position) {
    // Remove from our Photos reference data array
    this.photos.splice(position, 1);
    //await this.storage.set(PHOTO_STORAGE, this.photos);

    // delete photo file
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data
    });
  }
}

class Photo {
  filepath: string;
  webviewPath: string;
}

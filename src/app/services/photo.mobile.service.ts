import { PhotoService, Photo } from './PhotoService';
import { Plugins, CameraResultType, CameraPhoto, FilesystemDirectory, Capacitor } from '@capacitor/core';

const { Filesystem, Storage } = Plugins;

export class MobilePhotoService implements PhotoService {
  
  constructor() { }

  async loadSaved(storageKey): Promise<Photo[]> {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: storageKey });
    let photoArray = JSON.parse(photos.value) || [];
    
    return photoArray;
  }

  getCameraConfig(): CameraResultType {
    return CameraResultType.Uri;
  }
  
  async savePhoto(cameraPhoto: CameraPhoto): Promise<Photo> {
    // Read the file into its base64 version
    const base64Data = await Filesystem.readFile({
      path: cameraPhoto.path
    });

    // Write the file to the data directory (instead of temp storage)
    const fileName = new Date().getTime() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data.data,
      directory: FilesystemDirectory.Data
    });

    // Get the new, complete filepath
    const fileUri = await Filesystem.getUri({
      directory: FilesystemDirectory.Data,
      path: fileName
    });

    return {
      filepath: fileUri.uri,
      webviewPath: Capacitor.convertFileSrc(fileUri.uri),
      // Unused - Display photos using webviewPath instead.
      base64: ""
    };
  }
}

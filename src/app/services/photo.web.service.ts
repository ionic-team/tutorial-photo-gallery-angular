import { PhotoService, Photo } from './PhotoService';
import { Plugins, CameraResultType, CameraPhoto, FilesystemDirectory, Capacitor } from '@capacitor/core';

const { Filesystem, Storage } = Plugins;

export class WebPhotoService implements PhotoService {

  constructor() { }

  async loadSaved(storageKey): Promise<Photo[]> {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: storageKey });
    let photoArray = JSON.parse(photos.value) || [];

    // Read each saved photo's data from the Filesystem
    for (let photo of photoArray) {
      const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: FilesystemDirectory.Data
      });
      
      // Web platform only: Save the photo into the base64 field
      photo.base64 = `data:image/jpeg;base64,${readFile.data}`;
    }

    return photoArray;
  }

  getCameraConfig(): CameraResultType {
    return CameraResultType.DataUrl;
  }

  async savePhoto(cameraPhoto: CameraPhoto): Promise<Photo> {
    const base64Data = cameraPhoto.dataUrl;

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    return {
      filepath: fileName,
      base64: base64Data,
      // Unused - Display photos using base64 data instead.
      webviewPath: ""
    };
  }
}

import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@capacitor/core';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";

  constructor() { }

  async loadSaved() {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photos.value) || [];
  }

  /* Use the device camera to take a photo:
  // https://capacitor.ionicframework.com/docs/apis/camera
  
  // Store the photo data into permanent file storage:
  // https://capacitor.ionicframework.com/docs/apis/filesystem
  
  // Store a reference to all photo filepaths using Storage API:
  // https://capacitor.ionicframework.com/docs/apis/storage
  */
  public async takePhoto() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Base64, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });
    console.log(capturedPhoto);
    const savedImageFile = await this.savePicture(capturedPhoto);

    // Add new photo to Photos array
    this.photos.unshift({
      filepath: savedImageFile,
      //  http://localhost:8100/DATA/1575336859585.jpeg 404
      webviewPath: Capacitor.convertFileSrc(savedImageFile)
    });

    // // Cache all photo data for future retrieval
    // Storage.set({
    //   key: this.PHOTO_STORAGE,
    //   value: JSON.stringify(this.photos)
    // });
  }

  // Save picture to file on device
  private async savePicture(cameraPhoto: CameraPhoto) {

    const readFile = await this.handleWeb(cameraPhoto);

    // Read the file into its base64 version
    // const readFile = await Filesystem.readFile({
    //   path: cameraPhoto.path
    // });

    // Write the file to the data directory (instead of temp storage)
    const fileName = new Date().getTime() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      //data: readFile.data,
      data: readFile,
      directory: FilesystemDirectory.Data
    });

    // Get the new, complete filepath
    const fileUri = await Filesystem.getUri({
      directory: FilesystemDirectory.Data,
      path: fileName
    });
    // WEB uri: "/DATA/1575336434117.jpeg"
    console.log(fileUri); 

    return fileUri.uri;
  }

  private async handleWeb(cameraPhoto) : Promise<string> {
    return cameraPhoto.base64String;
    // const file = await fetch(cameraPhoto.webPath);
    // const readFile = await file.blob();

    // return new Promise((resolve) => {
    //   const reader = new FileReader();
    //       reader.onloadend = () => {
    //         console.log("web: " + reader.result.slice(0, 50));
    //         resolve(reader.result as string);
    //       };
    //   reader.readAsDataURL(readFile);
    // });
  }

  // Delete picture by removing it from reference data and the filesystem
  public async deletePicture(photo: Photo, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // delete photo file from filesystem
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

import { Injectable } from '@angular/core';
import { Plugins, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@capacitor/core';
import { Photo, IPhotoService } from './IPhotoService';
import { Platform } from '@ionic/angular';
import { WebPhotoService } from './photo.web.service';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";
  private photoService: IPhotoService;

  constructor(platform: Platform) {
    // if (platform.is('pwa')) { 
    //   this.photoService = new WebPhotoService();
    // }
    // else {
    //   this.photoService = new MobilePhotoService();
    // }
    
    // TODO: can this be init'd globally via app?  app.component.ts
    this.photoService = new WebPhotoService();
   }

  async loadSaved() {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photos.value) || [];
  }

  async loadSavedWeb() {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photos.value) || [];
    console.log(this.photos);

    for (let pho of this.photos) {
      const readFile = await Filesystem.readFile({
          path: pho.filepath,
          directory: FilesystemDirectory.Data
      });
      
      pho.base64 = `data:image/jpeg;base64,${readFile.data}`;
    }
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
      resultType: this.photoService.getCameraConfig(),
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });
    const savedImageFile = await this.savePhoto(capturedPhoto);

    // Add new photo to Photos array
    this.photos.unshift(savedImageFile);

    // Cache all photo data for future retrieval
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  // Save picture to file on device
  private async savePhoto(cameraPhoto: CameraPhoto) {

    return await this.photoService.savePhoto(cameraPhoto);

    // const readFile = await this.handleWeb(cameraPhoto);

    // // handleMobile( )
    // // Read the file into its base64 version
    // // const readFile = await Filesystem.readFile({
    // //   path: cameraPhoto.path
    // // });

    // // Write the file to the data directory (instead of temp storage)
    // const fileName = new Date().getTime() + '.jpeg';
    // await Filesystem.writeFile({
    //   path: fileName,
    //   //data: readFile.data,
    //   data: readFile,
    //   directory: FilesystemDirectory.Data
    // });

    // // Get the new, complete filepath
    // const fileUri = await Filesystem.getUri({
    //   directory: FilesystemDirectory.Data,
    //   path: fileName
    // });

    // return {
    //   filepath: fileName, //fileUri.uri mobile,
    //   webviewPath: Capacitor.convertFileSrc(fileUri.uri),
    //   base64: readFile
    // };
  }

  private async handleWeb(cameraPhoto) : Promise<string> {
    return cameraPhoto.dataUrl;
  }

  // Delete picture by removing it from reference data and the filesystem
  public async deletePhoto(photo: Photo, position: number) {
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
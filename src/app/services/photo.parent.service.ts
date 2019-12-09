import { Injectable } from '@angular/core';
import { Plugins, FilesystemDirectory, CameraSource } from '@capacitor/core';
import { Photo, PhotoService } from './PhotoService';
import { Platform } from '@ionic/angular';
import { WebPhotoService } from './photo.web.service';
import { MobilePhotoService } from './photo.mobile.service';

const { Camera, Filesystem, Storage } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class ParentPhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";
  private platformPhotoService: PhotoService;

  constructor(platform: Platform) {
    // Choose Photo Service implementation based on platform app is running on.
    // "cordova" will detect Cordova or Capacitor
    if (platform.is('cordova')) {
      this.platformPhotoService = new MobilePhotoService();
    }
    else {
      this.platformPhotoService = new WebPhotoService();
    }
   }

  // When this app is opened, load previously taken photos.
  async loadSaved() {
    this.photos = await this.platformPhotoService.loadSaved(this.PHOTO_STORAGE);
  }

  /* Use the device camera to take a photo:
  // https://capacitor.ionicframework.com/docs/apis/camera
  
  // Store the photo data into permanent file storage:
  // https://capacitor.ionicframework.com/docs/apis/filesystem
  
  // Store a reference to all photo filepaths using Storage API:
  // https://capacitor.ionicframework.com/docs/apis/storage
  */
  public async addNewToGallery() {
    // Take a photo using device camera
    const capturedPhoto = await Camera.getPhoto({
      resultType: this.platformPhotoService.getCameraConfig(),
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });
    const savedImageFile = await this.platformPhotoService.savePhoto(capturedPhoto);

    // Add new photo to Photos array
    this.photos.unshift(savedImageFile);

    // Cache all photo data for future retrieval
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos.map(p => {
        // Don't save the base64 representation of the photo data, 
        // since it's already saved on the Filesystem
        const photoCopy = { ...p };
        delete photoCopy.base64;

        return photoCopy;
        }))
    });
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

    // Delete photo file from filesystem
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data
    });
  }
}
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform, provideIonicAngular } from '@ionic/angular';

import type { UserPhoto } from './photo.service';
import { PhotoService } from './photo.service';

vi.mock('@capacitor/camera', () => ({
  Camera: { getPhoto: vi.fn() },
  CameraResultType: { Uri: 'uri' },
  CameraSource: { Camera: 'CAMERA' },
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { readFile: vi.fn(), writeFile: vi.fn(), deleteFile: vi.fn() },
  Directory: { Data: 'DATA' },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { convertFileSrc: (uri: string) => `converted:${uri}` },
}));

const NOW = 1700000000000;

describe('PhotoService', () => {
  let service: PhotoService;
  let isHybrid: boolean;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: `file:///data/${NOW}.jpeg` });

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideIonicAngular()],
    });
    service = TestBed.inject(PhotoService);

    isHybrid = false;
    vi.spyOn(TestBed.inject(Platform), 'is').mockImplementation((platform) => platform === 'hybrid' && isHybrid);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('addNewToGallery', () => {
    it('saves a web photo and adds it to the front of the gallery', async () => {
      const existing: UserPhoto = { filepath: 'older.jpeg', webviewPath: 'blob:older' };
      service.photos.set([existing]);
      vi.mocked(Camera.getPhoto).mockResolvedValue({ webPath: 'blob:new-photo', format: 'jpeg', saved: false });
      // Return the jsdom Blob directly: Node's Response would stringify it.
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ blob: async () => new Blob(['image-bytes'], { type: 'image/jpeg' }) }),
      );

      await service.addNewToGallery();

      expect(Camera.getPhoto).toHaveBeenCalledWith({ resultType: 'uri', source: 'CAMERA', quality: 100 });
      expect(Filesystem.writeFile).toHaveBeenCalledWith({
        path: `${NOW}.jpeg`,
        data: `data:image/jpeg;base64,${btoa('image-bytes')}`,
        directory: 'DATA',
      });
      expect(service.photos()).toEqual([{ filepath: `${NOW}.jpeg`, webviewPath: 'blob:new-photo' }, existing]);
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'photos', value: JSON.stringify(service.photos()) });
    });

    it.each([
      ['the photo cannot be read', 'error' as const],
      ['the photo is not read as a data URL', new ArrayBuffer(1)],
    ])('does not save a web photo when %s', async (_, outcome) => {
      vi.mocked(Camera.getPhoto).mockResolvedValue({ webPath: 'blob:new-photo', format: 'jpeg', saved: false });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['image-bytes']) }));
      vi.stubGlobal(
        'FileReader',
        class {
          result: unknown = null;
          onerror: ((error: unknown) => void) | null = null;
          onload: (() => void) | null = null;

          readAsDataURL(): void {
            if (outcome === 'error') {
              this.onerror?.(new Error('read failed'));
            } else {
              this.result = outcome;
              this.onload?.();
            }
          }
        },
      );

      await expect(service.addNewToGallery()).rejects.toBeDefined();

      expect(Filesystem.writeFile).not.toHaveBeenCalled();
      expect(service.photos()).toEqual([]);
      expect(Preferences.set).not.toHaveBeenCalled();
    });

    it('reads a native photo from its file path and converts the saved URI', async () => {
      isHybrid = true;
      vi.mocked(Camera.getPhoto).mockResolvedValue({
        path: 'file:///tmp/photo.jpeg',
        webPath: 'capacitor://localhost/_capacitor_file_/tmp/photo.jpeg',
        format: 'jpeg',
        saved: false,
      });
      vi.mocked(Filesystem.readFile).mockResolvedValue({ data: 'BASE64DATA' });

      await service.addNewToGallery();

      expect(Filesystem.readFile).toHaveBeenCalledWith({ path: 'file:///tmp/photo.jpeg' });
      expect(Filesystem.writeFile).toHaveBeenCalledWith({ path: `${NOW}.jpeg`, data: 'BASE64DATA', directory: 'DATA' });
      expect(service.photos()).toEqual([
        { filepath: `file:///data/${NOW}.jpeg`, webviewPath: `converted:file:///data/${NOW}.jpeg` },
      ]);
    });
  });

  describe('loadSaved', () => {
    it('loads saved photos and reads each file as base64 on the web', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({
        value: JSON.stringify([{ filepath: 'a.jpeg' }, { filepath: 'b.jpeg' }]),
      });
      vi.mocked(Filesystem.readFile).mockImplementation(async ({ path }) => ({ data: `data-for-${path}` }));

      await service.loadSaved();

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'photos' });
      expect(Filesystem.readFile).toHaveBeenCalledWith({ path: 'a.jpeg', directory: 'DATA' });
      expect(service.photos()).toEqual([
        { filepath: 'a.jpeg', webviewPath: 'data:image/jpeg;base64,data-for-a.jpeg' },
        { filepath: 'b.jpeg', webviewPath: 'data:image/jpeg;base64,data-for-b.jpeg' },
      ]);
    });

    it('keeps the stored paths on native without reading the files', async () => {
      isHybrid = true;
      const saved: UserPhoto[] = [{ filepath: 'file:///data/a.jpeg', webviewPath: 'converted:file:///data/a.jpeg' }];
      vi.mocked(Preferences.get).mockResolvedValue({ value: JSON.stringify(saved) });

      await service.loadSaved();

      expect(Filesystem.readFile).not.toHaveBeenCalled();
      expect(service.photos()).toEqual(saved);
    });

    it('starts with an empty gallery when nothing is saved', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });

      await service.loadSaved();

      expect(service.photos()).toEqual([]);
    });
  });

  describe('deletePhoto', () => {
    it('removes the photo from the gallery, storage, and filesystem', async () => {
      const photos: UserPhoto[] = [
        { filepath: 'file:///data/a.jpeg' },
        { filepath: 'file:///data/b.jpeg' },
        { filepath: 'file:///data/c.jpeg' },
      ];
      service.photos.set(photos);

      await service.deletePhoto(photos[1], 1);

      expect(service.photos()).toEqual([photos[0], photos[2]]);
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'photos', value: JSON.stringify([photos[0], photos[2]]) });
      expect(Filesystem.deleteFile).toHaveBeenCalledWith({ path: 'b.jpeg', directory: 'DATA' });
    });
  });
});

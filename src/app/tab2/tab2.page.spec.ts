import { provideZonelessChangeDetection, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { ActionSheetButton } from '@ionic/angular';
import { ActionSheetController, provideIonicAngular } from '@ionic/angular';

import type { UserPhoto } from '../services/photo.service';
import { PhotoService } from '../services/photo.service';

import { Tab2Page } from './tab2.page';

describe('Tab2Page', () => {
  const photos: UserPhoto[] = [
    { filepath: 'a.jpeg', webviewPath: 'data:image/jpeg;base64,AAA' },
    { filepath: 'b.jpeg', webviewPath: 'data:image/jpeg;base64,BBB' },
  ];

  let fixture: ComponentFixture<Tab2Page>;
  let photoService: {
    photos: ReturnType<typeof signal<UserPhoto[]>>;
    loadSaved: ReturnType<typeof vi.fn>;
    addNewToGallery: ReturnType<typeof vi.fn>;
    deletePhoto: ReturnType<typeof vi.fn>;
  };
  let actionSheet: { present: ReturnType<typeof vi.fn> };
  let actionSheetController: { create: ReturnType<typeof vi.fn> };

  // Returns the buttons passed to the action sheet the page opened.
  const actionSheetButtons = (): ActionSheetButton[] => actionSheetController.create.mock.calls[0][0].buttons;

  const tapPhoto = async (index: number): Promise<void> => {
    const buttons = fixture.nativeElement.querySelectorAll('ion-col button');
    buttons[index].click();
    await vi.waitFor(() => expect(actionSheet.present).toHaveBeenCalled());
  };

  beforeEach(async () => {
    photoService = {
      photos: signal(photos),
      loadSaved: vi.fn().mockResolvedValue(undefined),
      addNewToGallery: vi.fn().mockResolvedValue(undefined),
      deletePhoto: vi.fn().mockResolvedValue(undefined),
    };
    actionSheet = { present: vi.fn().mockResolvedValue(undefined) };
    actionSheetController = { create: vi.fn().mockResolvedValue(actionSheet) };

    await TestBed.configureTestingModule({
      imports: [Tab2Page],
      providers: [
        provideZonelessChangeDetection(),
        provideIonicAngular(),
        { provide: PhotoService, useValue: photoService },
        { provide: ActionSheetController, useValue: actionSheetController },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads the saved photos when the page opens', () => {
    expect(photoService.loadSaved).toHaveBeenCalledTimes(1);
  });

  it('shows a thumbnail for each photo', () => {
    const images: HTMLImageElement[] = Array.from(fixture.nativeElement.querySelectorAll('ion-col img'));

    expect(images.map((img) => img.getAttribute('src'))).toEqual(photos.map((photo) => photo.webviewPath));
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(['Photo 1', 'Photo 2']);
  });

  it('takes a photo when the camera button is tapped', () => {
    fixture.nativeElement.querySelector('ion-fab-button').click();

    expect(photoService.addNewToGallery).toHaveBeenCalledTimes(1);
  });

  it('opens the photo actions when a photo is tapped', async () => {
    await tapPhoto(1);

    expect(actionSheetController.create).toHaveBeenCalledWith(expect.objectContaining({ header: 'Photos' }));
    expect(actionSheetButtons()).toEqual([
      expect.objectContaining({ text: 'Delete', role: 'destructive', icon: 'trash' }),
      expect.objectContaining({ text: 'Cancel', role: 'cancel', icon: 'close' }),
    ]);
  });

  it('deletes the tapped photo when Delete is chosen', async () => {
    await tapPhoto(1);

    const deleteButton = actionSheetButtons().find((button) => button.text === 'Delete');
    expect(deleteButton?.handler).toBeTypeOf('function');
    deleteButton?.handler?.();

    expect(photoService.deletePhoto).toHaveBeenCalledWith(photos[1], 1);
  });

  it('keeps the photo when Cancel is chosen', async () => {
    await tapPhoto(0);

    const cancelButton = actionSheetButtons().find((button) => button.text === 'Cancel');
    expect(cancelButton?.handler).toBeTypeOf('function');
    cancelButton?.handler?.();

    expect(photoService.deletePhoto).not.toHaveBeenCalled();
  });
});

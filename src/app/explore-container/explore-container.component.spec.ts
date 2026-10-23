import { provideZonelessChangeDetection } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { ExploreContainerComponent } from './explore-container.component';

describe('ExploreContainerComponent', () => {
  let fixture: ComponentFixture<ExploreContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreContainerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreContainerComponent);
  });

  it('shows the page name', () => {
    fixture.componentRef.setInput('name', 'Tab 1 page');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('strong').textContent).toBe('Tab 1 page');
  });

  it('links to the Ionic UI components docs', () => {
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.href).toBe('https://ionicframework.com/docs/components');
    expect(link.target).toBe('_blank');
  });
});

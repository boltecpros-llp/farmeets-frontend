// Copy of blog-listing.spec.ts. Adjust tests for social-card if needed.
import { SocialCard } from './social-card';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('SocialCard', () => {
  let component: SocialCard;
  let fixture: ComponentFixture<SocialCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialCard]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

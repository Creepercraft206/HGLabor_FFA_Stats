import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FfaStatsComponent } from './ffa-stats.component';

describe('FfaStatsComponent', () => {
  let component: FfaStatsComponent;
  let fixture: ComponentFixture<FfaStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FfaStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FfaStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

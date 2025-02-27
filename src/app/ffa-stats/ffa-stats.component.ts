import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {KeyValuePipe, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BackendService} from '../backend.service';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import {animate, style, transition, trigger} from '@angular/animations';
import {MatSnackBar} from '@angular/material/snack-bar';

interface ExperiencePoints {
  experiencePoints: number;
}
interface Details {
  [key: string]: ExperiencePoints;
}
interface Ability {
  [key: string]: Details;
}
interface Hero {
  [key: string]: Ability;
}
interface Player {
  name: string;
  kills: number;
  deaths: number;
  highestKillStreak: number;
  xp: number;
  currentKillStreak: number;
  bounty: number;
  heroes: Record<string, Hero>;
}

interface AbilityProperty {
  type: string;
  baseValue: number;
  maxLevel: number;
  name: string;
  modifier: {
    type: string;
    steps: number[];
  };
  levelScale: number;
}
type AbilitySet = Record<string, AbilityProperty[]>;

interface HeroData {
  internalKey: string;
  properties: AbilitySet;
}

@Component({
  selector: 'app-ffa-stats',
  imports: [
    NgIf,
    FormsModule,
    NgForOf,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    MatExpansionPanelHeader,
    TitleCasePipe,
    KeyValuePipe
  ],
  animations: [
    trigger('enter', [
      transition(':enter', [
        style({ transform: "translateY(-100%)" }),
        animate('500ms ease-in', style({ transform: "translateY(0%)" }))
      ])
    ]),
    trigger('openModal', [
      transition(':enter', [
        style({ opacity: 0, transform: "translate(-50%, -100%)" }),
        animate('500ms ease', style({ opacity: 1, transform: "translate(-50%, -50%)" }))
      ])
    ])
  ],
  templateUrl: './ffa-stats.component.html',
  styleUrl: './ffa-stats.component.css'
})
export class FfaStatsComponent implements OnInit {

  constructor(private backendService: BackendService, private cdr: ChangeDetectorRef) { }

  private _snackBar = inject(MatSnackBar);

  loadingPlayer: boolean = false;

  playerSelected: boolean = false;

  inputPlayer: string = '';
  playerUUID: string = '';

  playerStats: Player = {
    name: '',
    kills: 0,
    deaths: 0,
    highestKillStreak: 0,
    xp: 0,
    currentKillStreak: 0,
    bounty: 0,
    heroes: {}
  };

  topPlayers: any[] = [];
  topTenPlayers: any[] = [];

  morePlayers: any[] = [];
  lastLoadedPlayerIndex: number = 0;


  playerInfoModalOpen: boolean = false;

  currentPlayer: Player = {
    name: '',
    kills: 0,
    deaths: 0,
    highestKillStreak: 0,
    xp: 0,
    currentKillStreak: 0,
    bounty: 0,
    heroes: {}
  };

  heroData: any[] = [];

  ngOnInit() {
    this.loadTopTenPlayers();
    this.getHeroData();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.searchPlayer();
      } else if (e.key === "Escape") {
        this.playerInfoModalOpen = false;
      }
    });
  }

  copyIP() {
    navigator.clipboard.writeText('hglabor.de');
    this.openSnackBar('IP kopiert!', 'OK');
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, { duration: 3000 });
  }

  searchPlayer() {
    if (!this.inputPlayer) {
      this.openSnackBar('Bitte gebe einen Spielernamen ein', 'OK');
      return;
    }

    if ((/^[0-9a-f]{32}$/i).test(this.inputPlayer)) {
      this.openSnackBar('Bitte nutze eine UUID im langen Format! (z.B. 26a4fcde-de39-4ff0-8ea1-786582b7d8ee)', 'OK');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(this.inputPlayer);

    this.loadingPlayer = true;
    const btn = document.querySelector(".search-player") as HTMLButtonElement;
    btn.disabled = true;

    if (isUUID) {
      // Search by UUID
      this.backendService.getPlayerStats(this.inputPlayer).subscribe({
        next: (stats: any) => {
          this.playerStats = stats;
          this.playerUUID = this.inputPlayer;
          this.backendService.getPlayerData(this.inputPlayer).subscribe({
            next: (data: any) => {
              this.playerStats.name = data.data.player.username;
            },
            error: (err: any) => {
              console.error('Error fetching player data:', err);
              this.openSnackBar('Error fetching player data', 'OK');
            }
          });

          this.playerSelected = true;
          const input = document.querySelector(".input") as HTMLDivElement;
          input.style.borderBottomLeftRadius = "0";
          input.style.borderBottomRightRadius = "0";
          this.calculateHeroAbilityLevels(this.playerStats);
          this.loadingPlayer = false;
          btn.disabled = false;
        },
        error: (err: any) => {
          console.error('Error fetching player stats:', err);
          this.openSnackBar('Error fetching player stats', 'OK');
          this.loadingPlayer = false;
          btn.disabled = false;
        }
      });
    } else {
      // Search by player name
      this.backendService.getPlayerData(this.inputPlayer).subscribe({
        next: (data: any) => {
          this.playerUUID = data.data.player.raw_id;

          this.backendService.getPlayerStats(data.data.player.id).subscribe({
            next: (stats: any) => {
              this.playerStats = stats;
              this.playerStats.name = this.inputPlayer;

              this.playerSelected = true;
              const input = document.querySelector(".input") as HTMLDivElement;
              input.style.borderBottomLeftRadius = "0";
              input.style.borderBottomRightRadius = "0";
              this.calculateHeroAbilityLevels(this.playerStats);
              this.loadingPlayer = false;
              btn.disabled = false;
            },
            error: (err: any) => {
              console.error('Error fetching player stats:', err);
              this.openSnackBar('Error fetching player stats', 'OK');
              this.loadingPlayer = false;
              btn.disabled = false;
            }
          });
        },
        error: (err: any) => {
          console.error('Error fetching player data:', err);
          this.openSnackBar('Error fetching player data', 'OK');
          this.loadingPlayer = false;
          btn.disabled = false;
        }
      });
    }
  }

  loadTopTenPlayers() {
    this.backendService.getTopPlayers().subscribe({
      next: (data: any) => {
        this.topPlayers = data;
        this.lastLoadedPlayerIndex = 10;
        this.topTenPlayers = data.slice(0, 10);
        this.topTenPlayers.forEach((player: any, index: number) => {
          let uuid = player.playerId.replace(/-/g, '');
          this.backendService.getPlayerNameByUUID(uuid).subscribe({
            next: (name: any) => {
              this.topTenPlayers.at(index).name = name.data.player.username;
            },
            error: (err: any) => {
              console.error('Error fetching player name:', err);
              this.openSnackBar('Error fetching player name', 'OK');
            }
          });
        });
      },
      error: (err: any) => {
        console.error('Error fetching top players:', err);
        this.openSnackBar('Error fetching top players', 'OK');
      }
    });
  }

  loadMorePlayers() {
    const newPlayers = this.topPlayers.slice(this.lastLoadedPlayerIndex, this.lastLoadedPlayerIndex + 10);
    this.lastLoadedPlayerIndex += 10;
    newPlayers.forEach((player: any, index: number) => {
      let uuid = player.playerId.replace(/-/g, '');
      this.backendService.getPlayerNameByUUID(uuid).subscribe({
        next: (name: any) => {
          newPlayers[index].name = name.data.player.username;
        },
        error: (err: any) => {
          console.error('Error fetching player name:', err);
          this.openSnackBar('Error fetching player name', 'OK');
        }
      });
    });
    this.morePlayers.push(...newPlayers);
  }

  openPlayerInfoModal(uuid: string) {
    this.playerInfoModalOpen = true;
    this.cdr.detectChanges(); // Ensure Angular detects changes
    setTimeout(() => {
      const skinRender = document.querySelector(".skin-render") as HTMLIFrameElement;
      if (skinRender) {
        skinRender.src = `https://laby.net/embed#uuid=${uuid}`;
      }
    }, 10);
    this.currentPlayer = this.topPlayers.find(player => player.playerId === uuid);
    this.calculateHeroAbilityLevels(this.currentPlayer);
  }

  getHeroData() {
    this.backendService.getHeroData('aang').subscribe((data: any) => {
      this.heroData.push(data);
    });
    this.backendService.getHeroData('katara').subscribe((data: any) => {
      this.heroData.push(data);
    });
    this.backendService.getHeroData('toph').subscribe((data: any) => {
      this.heroData.push(data);
    });
  }

  calculateHeroAbilityLevels(player: Player) {
    const heroes = player.heroes;

    for (const hero in heroes) {
      const heroData = heroes[hero];
      for (const ability in heroData) {
        for (const key in heroData[ability]) {
          const experiencePoints = heroData[ability][key]['experiencePoints'] ?? 0;
          const levelScale = this.getLevelScaleForAbility(hero, ability, key);

          if (typeof experiencePoints === 'number' && typeof levelScale === 'number') {
            const level = Math.cbrt(experiencePoints / levelScale);
            player.heroes[hero][ability][key]['level'] = { experiencePoints: Math.floor(level) };
          } else {
            console.error(`Invalid experiencePoints or levelScale for hero: ${hero}, ability: ${ability}, key: ${key}`);
            player.heroes[hero][ability][key]['level'] = { experiencePoints: 0 };
          }
        }
      }
    }
  }

  getLevelScaleForAbility(hero: string, ability: string, key: string): number {
    const heroData = this.heroData.find(h => h.internalKey === hero);
    if (!heroData) return -1;

    const abilityProperty = heroData.properties[ability];
    if (!abilityProperty) return -1;

    const keyProperty = abilityProperty.find((prop: { name: string; }) => prop.name.toLowerCase() === this.formatHeroText(key).toLowerCase());
    if (!keyProperty) return -1;

    return keyProperty.levelScale ?? -1;
  }


  formatHeroText(str: string) {
    // Convert snake_case to Title Case
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  cropHeroText(abilityStr: string, str: string) {
    return str.replace(abilityStr, '');
  }
}

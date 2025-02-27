import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http: HttpClient) { }

  getPlayerStats(uuid: string) {
    const url = `https://api.hglabor.de/stats/ffa/${uuid}`;
    return this.http.get(url);
  }

  getPlayerData(player: string) {
    return this.http.get(`https://playerdb.co/api/player/minecraft/${player}`);
  }

  getPlayerNameByUUID(uuid: string) {
    return this.http.get(`https://playerdb.co/api/player/minecraft/${uuid}`);
  }

  getTopPlayers() {
    return this.http.get('https://api.hglabor.de/stats/FFA/top?sort=kills&page=1');
  }

  getHeroData(hero: string) {
    return this.http.get(`https://api.hglabor.de/ffa/hero/${hero}`);
  }
}

import snakeCase from 'snake-case';

import StorageService, { storageSvc } from '@services/storage.service';
import MonitoringService, { monitoringSvc } from '@services/monitoring.service';
import { progressionSvc } from './progression.service';

import { ITrophy, IChecklistOption } from '@achievements/models/trophy.model';

import { PROGRESSION_TROPHIES_STORAG_KEYS } from '@achievements/constants/progressionTrophiesStorageKeys.constants';
import { STORAGES_KEY } from '@achievements/constants/storageKey.constants';

import { TROPHIES } from '@achievements/constants/trophies.constants';
import { COMPARISON_TYPE } from '@shared/enums/comparaison.enum';
import { TROPHY_TYPE } from '@shared/enums/trophyType.enum';

import MathUtils from '@shared/utils/Math.utils';

class AchievementService {

  private storageSvc: StorageService;
  private monitoringSvc: MonitoringService;

  private storage: Object;

  private trophies: ITrophy[];

  constructor() {
    this.storageSvc = storageSvc;
    this.monitoringSvc = monitoringSvc;

    this.trophies = TROPHIES;

    this.storage = this.storageSvc.get(STORAGES_KEY.trophies) || {};
  }

  /**
   * Check if trophy is unlocked
   * @param {string} - key
   */
  check(key: string) {
    // get trophies concerned by progression setted
    const trophiesConcerned = this.trophies.filter(
      (trophy: ITrophy) => trophy.checklist.some((option: IChecklistOption) => option.value === key)
    );

    for (const trophy of trophiesConcerned) {
      const trophyName = snakeCase(trophy.value); // convert value
      if (this.storageSvc.isInStorage(STORAGES_KEY.completed, trophyName)) continue;

      // get trophy checklist
      let checklist: string[] = this.storageSvc.get(STORAGES_KEY.trophies)[trophyName];
      if (!checklist) {
        // init trophy in local storage
        this.initTrophyInStorage(trophyName);
        checklist = [];
      }

      // if some option in checklist have a limit input
      if (trophy.checklist.some((option: IChecklistOption) => option.limit !== undefined)) {
        const count = this.storageSvc.get(STORAGES_KEY.progression)[key];
        const checklistItem = trophy.checklist.find((option: IChecklistOption) => {
          // find item in checklist to check based on progression setted
          if (option.comparison && option.comparison === COMPARISON_TYPE.SUPERIOR) return count >= option.limit;
          return option.limit === count;
        });
        if (!checklistItem) continue;
      }

      // option in checklist is concerned and unlocked
      checklist.push(key);
      const set = new Set<string>(checklist);
      this.storage[trophyName] = [...set];

      this.storageSvc.set(STORAGES_KEY.trophies, this.storage);

      // check if trophy is unlocked
      if (this.checkTrophyCompleted(trophy, [...set])) this.unlockTrophy(trophy);
    }
  }

  /**
   * Init trophy in storage
   * @param {string} - trophyName
   */
  private initTrophyInStorage(trophyName: string) {
    this.storage[trophyName] = [];
    this.storageSvc.set(STORAGES_KEY.trophies, this.storage);
  }

  /**
   * Check if trophy is unlocked
   * @param {ITrophy} - trophy
   * @param {string[]} list
   */
  private checkTrophyCompleted(trophy: ITrophy, list: string[]): boolean {
    return trophy.checklist.length === list.length;
  }

  /**
   * Unlock trophy
   * @param {ITrophy} - trophy
   */
  private unlockTrophy(trophy: ITrophy) {
    // trophy completed
    const completedArray = this.storageSvc.get(STORAGES_KEY.completed);
    (<string[]>completedArray).push(snakeCase(trophy.value));
    this.storageSvc.set(STORAGES_KEY.completed, completedArray);

    // send event to google analytics
    this.monitoringSvc.sendEvent(this.monitoringSvc.categories.trophy, this.monitoringSvc.actions.completed, snakeCase(trophy.value));

    // update trophy progression
    progressionSvc.setValue(
      PROGRESSION_TROPHIES_STORAG_KEYS.unlock_trophies_percentage,
      MathUtils.percent(this.storageSvc.getTrophiesCompleted(), this.trophies.filter((trophy: ITrophy) => trophy.type !== TROPHY_TYPE.TROPHY))
    );
  }

}

export const achievementSvc = new AchievementService();
export default AchievementService;

import React from 'react';
import classNames from 'classnames';

import CommonUtils from '@app/shared/utils/Common.utils';
import { H1, H2, H3, H4, H5 } from '@public/components/hx/hx';
import Row from '@public/components/row/row';

import { progressionSvc } from '@achievements/services/progression.service';
import { translationSvc } from '@shared/services/translation.service';

import { IProgressionWithCount } from '@achievements/models/progression.model';
import { IProgressionBiomesStorageKeys } from '@app/achievements/models/progressionBiomesStorageKeys.model';

import './progress-tab.styles';

import FjordPic from '@images/biomes/fjord/preview_001.png';
import OceanPic from '@images/biomes/ocean/preview_001.png';
import RainforestPic from '@images/biomes/rainforest/preview_001.png';
import SwampPic from '@images/biomes/swamp/preview_001.png';
import DesertPic from '@images/biomes/desert/preview_001.png';
import SnowyHillsPic from '@images/biomes/snowy_hills/preview_001.png';
import HighlandsPic from '@images/biomes/highlands/preview_001.png';
import DesertIslandPic from '@images/biomes/desert_island/preview_001.png';

type IBiomeProgress = {
  name: string;
  unlocked: boolean;
  image?: string;
};

const BiomeProgress: React.FunctionComponent<IBiomeProgress> = ({ name, image, unlocked }) => {
  return (
    <div className={classNames('biome-progress',  unlocked && 'biome-progress--unlocked')}>
      <img src={image} />
      <h4>{name}</h4>
    </div>
  );
};

type IProgressTabState = {
  progression: IProgressionWithCount[];
};

class ProgressTab extends React.Component<any, IProgressTabState> {
  state = {
    progression: progressionSvc.getProgressionShown()
  };

  render() {
    const progression: any = progressionSvc.getProgressionStorage();

    return (
      <div className='tab progress-tab'>
        <header className='tab__header'>
          <H3 className='title color-theme mb-2'>{translationSvc.translate('UI.progress-tab.title')}</H3>
        </header>
        <div className='tab__content'>
          <Row Tag='ul' className='biome-progress mb-2'>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Desert' image={DesertPic} unlocked={progression.desert_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Highlands' image={HighlandsPic} unlocked={progression.highland_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Ocean' image={OceanPic} unlocked={progression.ocean_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Rainforest' image={RainforestPic} unlocked={progression.rainforest_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Swamps' image={SwampPic} unlocked={progression.swamp_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Snowy hills' image={SnowyHillsPic} unlocked={progression.snow_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Fjords' image={FjordPic} unlocked={progression.fjord_visited} /></li>
            <li className='flexcol flexcol--12 flexcol--8-t flexcol--6-d mb-1'><BiomeProgress name='Desert Island' image={DesertIslandPic} unlocked={progression.desert_island_visited} /></li>
          </Row>
          <ul className='overall-progress'>
          {this.state.progression.map((item: IProgressionWithCount, index: number) => (
            <li className='p-2 pt-1 pb-1' key={index}>
              {translationSvc.translate(`UI.progress-tab.${item.name}`, { count: CommonUtils.formatNumberWithSpaces(item.count) })}
            </li>
          ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default ProgressTab;

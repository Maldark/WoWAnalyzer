import React from 'react';

import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import SpellIcon from 'common/SpellIcon';
import { formatPercentage } from 'common/format';

import Module from 'Parser/Core/Module';

import StatisticBox, { STATISTIC_ORDER } from 'Main/StatisticBox';

const CB_DURATION = 15000;
const debug = false;

class ComboBreaker extends Module {
  CBProcsTotal = 0;
  lastCBProcTime = 0;
  consumedCBProc = 0;
  overwrittenCBProc = 0;
  nonCBBoK = 0;
  serenityBoKCast = 0;

  on_byPlayer_applybuff(event) {
    const spellId = event.ability.guid;
    if (SPELLS.COMBO_BREAKER_BUFF.id === spellId) {
      this.lastCBProcTime = event.timestamp;
      debug && console.log('CB Proc Applied');
      this.CBProcsTotal += 1;
    }
  }

  on_byPlayer_refreshbuff(event) {
    const spellId = event.ability.guid;
    if (SPELLS.COMBO_BREAKER_BUFF.id === spellId) {
      this.lastCBProcTime = event.timestamp;
      debug && console.log('CB Proc Overwritten');
      this.CBProcsTotal += 1;
      this.overwrittenCBProc += 1;
    }
  }
  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;
    if (SPELLS.BLACKOUT_KICK.id !== spellId) {
      return;
    }
    if (this.lastCBProcTime !== event.timestamp) {
      if (this.lastCBProcTime === null) {
        this.nonCBBoK += 1;
        return;
      }
      const cbTimeframe = this.lastCBProcTime + CB_DURATION;
      if (event.timestamp > cbTimeframe) {
        this.nonCBBoK += 1;
      } else {
        this.consumedCBProc += 1;
        debug && console.log(`CB Proc Consumed / Timestamp: ${event.timestamp}`);
        this.lastCBProcTime = null;
      }
    }
  }
  suggestions(when) {
    const unusedCBprocs = 1 - (this.consumedCBProc / this.CBProcsTotal);
    when(unusedCBprocs).isGreatherThan(0.2).addSuggestion((suggest, actual, recommended) => {
      return suggest(<span>Your <SpellLink id={SPELLS.COMBO_BREAKER_BUFF.id} /> procs should be used as soon as you get them so they are not overwritten. While some will be overwritten due to the nature of the spell interactions, holding <SpellLink id={SPELLS.COMBO_BREAKER_BUFF.id} /> procs is not optimal.</span>)
        .icon(SPELLS.COMBO_BREAKER_BUFF.icon)
        .actual(`${formatPercentage(unusedCBprocs)}% Unused Combo Breaker procs`)
        .recommended(`<${formatPercentage(recommended)}% wasted Combo Breaker is recommended`)
        .regular(recommended + 0.1).major(recommended + 0.2);
    });
  }
  statistic() {
    const unusedUTProcs = 1 - (this.consumedCBProc / this.CBProcsTotal);
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.COMBO_BREAKER_BUFF.id} />}
        value={`${formatPercentage(unusedUTProcs)}%`}
        label={(
          <dfn data-tip={`You got total <b>${this.CBProcsTotal} Combo Breaker procs</b> and <b>used ${this.consumedCBProc}</b> of them. ${this.nonCBBoK} of your vivify's were used without an uplifting trance procs.`}>
            Unused Procs
          </dfn>
        )}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.OPTIONAL(40);
}

export default ComboBreaker;

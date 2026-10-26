import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createOriginalRestoreGate} from '../src/original-restore-gate.js';
import {copy} from '../src/i18n.js';

test('all models require ten full seconds and an explicit acknowledgement', () => {
  for (const model of ['gr3','gr3x','gr4']) {
    let time = 0;
    const gate = createOriginalRestoreGate(() => time);
    assert.equal(gate.allows(model,true),false);
    gate.start(model);
    assert.equal(gate.remaining(),10);
    time = 9999;
    assert.equal(gate.remaining(),1);
    assert.equal(gate.allows(model,true),false);
    time = 10000;
    assert.equal(gate.remaining(),0);
    assert.equal(gate.allows(model,false),false);
    assert.equal(gate.allows(model,'true'),false);
    assert.equal(gate.allows(model,true),true);
    assert.equal(gate.allows('another-model',true),false);
  }
});

test('cancel, model change and reopening cannot reuse the previous wait', () => {
  let time = 0;
  const gate = createOriginalRestoreGate(() => time);
  gate.start('gr4');time = 10000;
  assert.equal(gate.allows('gr4',true),true);
  gate.reset();assert.equal(gate.allows('gr4',true),false);
  gate.start('gr4');assert.equal(gate.remaining(),10);
  assert.equal(gate.allows('gr4',true),false);
  time = 20000;gate.start('gr3');
  assert.equal(gate.allows('gr4',true),false);
  assert.equal(gate.allows('gr3',true),false);
  time = 30000;assert.equal(gate.allows('gr3',true),true);
});

test('every language explains reset, restart, disabled custom features and the boot risk', () => {
  for (const locale of ['zh','en','ja']) {
    const t = copy[locale];
    for (const key of ['originalRestoreTitle','originalRestoreRisk','originalRestoreWait','originalRestoreAcknowledge','originalRestoreConfirm','originalRestoreIncomplete']) assert.ok(t[key],`${locale} ${key}`);
    assert.equal(t.originalRestoreSteps.length,3);
    assert.ok(t.originalRestoreSteps[2].includes('XerFilm GR'));
    assert.ok(t.originalRestoreAcknowledge.includes('XerFilm GR'));
  }
});

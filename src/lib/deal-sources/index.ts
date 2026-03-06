// Registry of all deal sources.
// To add a new site: import its adapter here and add to ALL_SOURCES.

import type { DealSource } from './_base';
import dansdeals from './dansdeals';
import pzdeals from './pzdeals';
import simplexdeals from './simplexdeals';
import savecrazydeals from './savecrazydeals';
import kesefdeals from './kesefdeals';
import stundeals from './stundeals';

export const ALL_SOURCES: DealSource[] = [
    dansdeals,
    pzdeals,
    simplexdeals,
    savecrazydeals,
    kesefdeals,
    stundeals,
];

export { dansdeals, pzdeals, simplexdeals, savecrazydeals, kesefdeals, stundeals };
export type { DealSource, RawDeal } from './_base';

import { format as d3Format } from 'd3-format';

export const sendGAEvent = (category, action, label) => {
  if (!("dataLayer" in window)) {
    window.dataLayer = [];
  }

  dataLayer.push({
    event: category,
    action: action,
    label: label,
  });
};


/**
 *
 * Adapted from https://github.com/vulekamali/data-visualisations/blob/83553e4a4be2ddb166099ef17ea4b41f355818e6/src/util.js
 *
 */


export const formatRand = (x, decimals, randSpace) => {
  decimals = decimals === undefined ? 1 : decimals; // eslint-disable-line no-param-reassign
  randSpace = randSpace === undefined ? ' ' : ''; // eslint-disable-line no-param-reassign
  return `R${randSpace}${d3Format(`,.${decimals}f`)(x)}`;
};

export const humaniseRand = (x, longForm) => { // eslint-disable-line import/prefer-default-export
  longForm = longForm === undefined ? true : longForm; // eslint-disable-line no-param-reassign
  const randSpace = longForm ? ' ' : '';
  const decimals = longForm ? 1 : 0;
  const suffixBillion = longForm === true ? ' billion' : 'bn';
  const suffixMillion = longForm === true ? ' million' : 'm';
  const suffixThousand = longForm === true ? '  thousand' : 'k';

  if (Math.abs(x) >= 1000000000) {
    return formatRand(x / 1000000000, decimals, randSpace) + suffixBillion;
  } if (Math.abs(x) >= 1000000) {
    return formatRand(x / 1000000, decimals, randSpace) + suffixMillion;
  } if (!longForm && Math.abs(x) >= 100000) {
    return formatRand(x / 1000, decimals, randSpace) + suffixThousand;
  }
  return formatRand(x, 2);
};
